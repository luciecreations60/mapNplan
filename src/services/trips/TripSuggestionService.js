import { supabase } from '../../config/supabase.config.js';

const SUGGESTIONS = 'trip_suggestions';
const VOTES = 'trip_suggestion_votes';

/**
 * Suggestions from trip participants.
 *
 * A trip is stored as a single JSON document, so two people writing it at the
 * same time would overwrite each other. Suggestions sidestep that entirely:
 * they live in their own rows, only ever appended, and the trip itself is
 * rewritten by one person — the owner or a co-organizer — when they accept one.
 */

export const SUGGESTION_KINDS = Object.freeze(['place', 'change', 'comment']);

async function currentIdentity() {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  return {
    email: String(user?.email || '').toLowerCase(),
    id: user?.id || null,
  };
}

export async function listSuggestions(tripId) {
  if (!tripId) return [];

  const { data, error } = await supabase
    .from(SUGGESTIONS)
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Unable to load suggestions.', error);
    return [];
  }

  const suggestions = data || [];
  if (suggestions.length === 0) return [];

  const { data: voteRows, error: voteError } = await supabase
    .from(VOTES)
    .select('suggestion_id, voter_email, value')
    .in('suggestion_id', suggestions.map((suggestion) => suggestion.id));

  if (voteError) console.error('Unable to load suggestion votes.', voteError);

  const { email } = await currentIdentity();
  const votesBySuggestion = new Map();
  for (const vote of voteRows || []) {
    const bucket = votesBySuggestion.get(vote.suggestion_id) || { up: 0, down: 0, mine: 0 };
    if (vote.value > 0) bucket.up += 1; else bucket.down += 1;
    if (vote.voter_email?.toLowerCase() === email) bucket.mine = vote.value;
    votesBySuggestion.set(vote.suggestion_id, bucket);
  }

  return suggestions.map((suggestion) => ({
    ...suggestion,
    votes: votesBySuggestion.get(suggestion.id) || { up: 0, down: 0, mine: 0 },
  }));
}

export async function createSuggestion(tripId, { kind, title = '', body = '', payload = {}, targetEntityId = null, authorName = '' }) {
  if (!tripId || !SUGGESTION_KINDS.includes(kind)) throw new Error('Invalid suggestion.');

  const { email } = await currentIdentity();
  if (!email) throw new Error('You must be signed in to suggest.');

  const { data, error } = await supabase
    .from(SUGGESTIONS)
    .insert({
      trip_id: tripId,
      author_email: email,
      author_name: authorName,
      kind,
      title,
      body,
      payload,
      target_entity_id: targetEntityId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function resolveSuggestion(suggestionId, status) {
  if (!['accepted', 'declined'].includes(status)) throw new Error('Invalid status.');

  const { id } = await currentIdentity();
  const { error } = await supabase
    .from(SUGGESTIONS)
    .update({ status, resolved_by: id, resolved_at: new Date().toISOString() })
    .eq('id', suggestionId);

  if (error) throw error;
}

export async function deleteSuggestion(suggestionId) {
  const { error } = await supabase.from(SUGGESTIONS).delete().eq('id', suggestionId);
  if (error) throw error;
}

/**
 * Voting is a toggle: pressing the same side again withdraws the vote, so a
 * participant is never stuck with an opinion they changed their mind about.
 */
export async function voteOnSuggestion(suggestionId, value, currentValue = 0) {
  const { email } = await currentIdentity();
  if (!email) throw new Error('You must be signed in to vote.');

  if (value === currentValue) {
    const { error } = await supabase
      .from(VOTES)
      .delete()
      .eq('suggestion_id', suggestionId)
      .eq('voter_email', email);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from(VOTES)
    .upsert({ suggestion_id: suggestionId, voter_email: email, value });
  if (error) throw error;
}
