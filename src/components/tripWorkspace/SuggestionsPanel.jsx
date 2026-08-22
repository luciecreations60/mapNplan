import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { formatLocalizedDateTime } from '../../utils/date.js';
import { isApplicable, applySuggestion } from '../../utils/suggestionApply.js';
import {
  createSuggestion,
  deleteSuggestion,
  listSuggestions,
  resolveSuggestion,
  voteOnSuggestion,
} from '../../services/trips/TripSuggestionService.js';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';
import { LocationAutocomplete } from '../common/LocationAutocomplete.jsx';

const EMPTY_FORM = Object.freeze({
  kind: 'place',
  title: '',
  body: '',
  location: '',
  latitude: null,
  longitude: null,
  date: '',
  targetEntityId: '',
  field: 'time',
  value: '',
});

const CHANGE_FIELDS = Object.freeze([
  { id: 'time', labelKey: 'suggestions.fieldTime', inputType: 'time' },
  { id: 'date', labelKey: 'suggestions.fieldDate', inputType: 'date' },
  { id: 'amount', labelKey: 'suggestions.fieldAmount', inputType: 'number' },
  { id: 'location', labelKey: 'suggestions.fieldLocation', inputType: 'text' },
]);

export function SuggestionsPanel({ trip, onUpdate, canEdit }) {
  const { locale, t } = useI18n();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const myEmail = String(user?.email || '').toLowerCase();

  const activities = useMemo(
    () => (trip.itinerary || []).flatMap((day) => (day.items || []).map((item) => ({ ...item, date: day.date }))),
    [trip.itinerary],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setSuggestions(await listSuggestions(trip.id));
    setLoading(false);
  }, [trip.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const pending = suggestions.filter((suggestion) => suggestion.status === 'pending');
  const resolved = suggestions.filter((suggestion) => suggestion.status !== 'pending');

  async function submit(event) {
    event.preventDefault();
    try {
      if (form.kind === 'place' && !form.title.trim()) return;
      if (form.kind === 'comment' && !form.body.trim()) return;
      if (form.kind === 'change' && (!form.targetEntityId || !form.value)) return;

      await createSuggestion(trip.id, {
        kind: form.kind,
        title: form.kind === 'change'
          ? activities.find((activity) => activity.id === form.targetEntityId)?.title || ''
          : form.title.trim(),
        body: form.body.trim(),
        authorName: user?.email?.split('@')[0] || '',
        targetEntityId: form.kind === 'change' ? form.targetEntityId : null,
        payload: form.kind === 'place'
          ? {
            title: form.title.trim(),
            location: form.location.trim(),
            latitude: form.latitude,
            longitude: form.longitude,
            date: form.date || '',
          }
          : form.kind === 'change'
            ? { field: form.field, value: form.value }
            : {},
      });

      setForm(EMPTY_FORM);
      setNotice({ tone: 'success', text: t('suggestions.sent') });
      refresh();
    } catch (error) {
      setNotice({ tone: 'danger', text: t('suggestions.sendFailed') });
    }
  }

  async function handleVote(suggestion, value) {
    setBusyId(suggestion.id);
    try {
      await voteOnSuggestion(suggestion.id, value, suggestion.votes.mine);
      await refresh();
    } catch (error) {
      setNotice({ tone: 'danger', text: t('suggestions.voteFailed') });
    } finally {
      setBusyId(null);
    }
  }

  /**
   * Accepting applies the suggestion to the trip. The trip is only written
   * once the change could actually be computed, so a suggestion that no longer
   * matches the itinerary is reported instead of silently doing nothing.
   */
  async function accept(suggestion) {
    setBusyId(suggestion.id);
    try {
      const patch = applySuggestion(trip, suggestion);
      if (!patch) {
        setNotice({ tone: 'warning', text: t('suggestions.notApplicable') });
        setBusyId(null);
        return;
      }
      onUpdate(patch);
      await resolveSuggestion(suggestion.id, 'accepted');
      await refresh();
      setNotice({ tone: 'success', text: t('suggestions.accepted') });
    } catch (error) {
      setNotice({ tone: 'danger', text: t('suggestions.resolveFailed') });
    } finally {
      setBusyId(null);
    }
  }

  async function decline(suggestion) {
    setBusyId(suggestion.id);
    try {
      await resolveSuggestion(suggestion.id, 'declined');
      await refresh();
    } catch (error) {
      setNotice({ tone: 'danger', text: t('suggestions.resolveFailed') });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(suggestion) {
    if (!window.confirm(t('suggestions.deleteConfirm'))) return;
    try {
      await deleteSuggestion(suggestion.id);
      refresh();
    } catch (error) {
      setNotice({ tone: 'danger', text: t('suggestions.resolveFailed') });
    }
  }

  function renderCard(suggestion) {
    const score = suggestion.votes.up - suggestion.votes.down;
    const applicable = isApplicable(suggestion);
    return (
      <Card key={suggestion.id} className={`suggestion-card suggestion-card--${suggestion.status}`}>
        <div className="suggestion-card__votes">
          <button
            type="button"
            className={`icon-button icon-button--small${suggestion.votes.mine > 0 ? ' icon-button--active' : ''}`}
            aria-label={t('suggestions.voteUp')}
            disabled={busyId === suggestion.id}
            onClick={() => handleVote(suggestion, 1)}
          >
            <Icon name="chevronUp" size={16} />
          </button>
          <strong>{score > 0 ? `+${score}` : score}</strong>
          <button
            type="button"
            className={`icon-button icon-button--small${suggestion.votes.mine < 0 ? ' icon-button--active' : ''}`}
            aria-label={t('suggestions.voteDown')}
            disabled={busyId === suggestion.id}
            onClick={() => handleVote(suggestion, -1)}
          >
            <Icon name="chevronDown" size={16} />
          </button>
        </div>

        <div className="suggestion-card__body">
          <div className="suggestion-card__head">
            <Badge tone={suggestion.kind === 'place' ? 'primary' : suggestion.kind === 'change' ? 'warning' : 'neutral'}>
              {t(`suggestions.kind_${suggestion.kind}`)}
            </Badge>
            {suggestion.status === 'accepted' && <Badge tone="success">{t('suggestions.statusAccepted')}</Badge>}
            {suggestion.status === 'declined' && <Badge tone="neutral">{t('suggestions.statusDeclined')}</Badge>}
            <span className="suggestion-card__meta">
              {suggestion.author_name || suggestion.author_email} · {formatLocalizedDateTime(suggestion.created_at, locale)}
            </span>
          </div>

          {suggestion.title && <h4>{suggestion.title}</h4>}
          {suggestion.kind === 'change' && (
            <p className="suggestion-card__change">
              {t('suggestions.proposes', {
                field: t(CHANGE_FIELDS.find((item) => item.id === suggestion.payload?.field)?.labelKey || 'suggestions.fieldTime'),
                value: suggestion.payload?.value,
              })}
            </p>
          )}
          {suggestion.payload?.location && <p className="suggestion-card__meta"><Icon name="pin" size={13} /> {suggestion.payload.location}</p>}
          {suggestion.body && <p>{suggestion.body}</p>}

          {suggestion.status === 'pending' && (
            <div className="suggestion-card__actions">
              {canEdit && applicable && (
                <Button size="small" icon="check" disabled={busyId === suggestion.id} onClick={() => accept(suggestion)}>
                  {t('suggestions.accept')}
                </Button>
              )}
              {canEdit && (
                <Button variant="secondary" size="small" icon="close" disabled={busyId === suggestion.id} onClick={() => decline(suggestion)}>
                  {t('suggestions.decline')}
                </Button>
              )}
              {suggestion.author_email?.toLowerCase() === myEmail && (
                <button type="button" className="text-link" onClick={() => remove(suggestion)}>
                  <Icon name="trash" size={14} /> {t('common.delete')}
                </button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="workspace-section suggestions-panel">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('suggestions.eyebrow')}</p>
          <h2>{t('suggestions.title')}</h2>
          <p>{canEdit ? t('suggestions.introOrganizer') : t('suggestions.introParticipant')}</p>
        </div>
      </section>

      {notice && <InlineNotice tone={notice.tone} className="page-notice">{notice.text}</InlineNotice>}

      <Card className="suggestion-form-card">
        <form className="workspace-form" onSubmit={submit}>
          <div className="suggestion-kind-switch" role="group" aria-label={t('suggestions.kindLabel')}>
            {['place', 'change', 'comment'].map((kind) => (
              <button
                key={kind}
                type="button"
                className={`suggestion-kind-switch__option${form.kind === kind ? ' is-active' : ''}`}
                onClick={() => setForm((current) => ({ ...EMPTY_FORM, kind, body: current.body }))}
              >
                {t(`suggestions.kind_${kind}`)}
              </button>
            ))}
          </div>

          <div className="workspace-form__grid">
            {form.kind === 'place' && (
              <>
                <label className="workspace-field workspace-form__wide">
                  <span>{t('suggestions.placeName')}</span>
                  <input value={form.title} onChange={(event) => setForm((c) => ({ ...c, title: event.target.value }))} required />
                </label>
                <div className="workspace-field workspace-form__wide">
                  <LocationAutocomplete
                    id="suggestion-location"
                    label={t('common.location')}
                    value={form.location}
                    onValueChange={(value) => setForm((c) => ({ ...c, location: value }))}
                    onPlaceSelect={(place) => setForm((c) => ({
                      ...c,
                      location: place?.label || c.location,
                      latitude: place?.latitude ?? c.latitude,
                      longitude: place?.longitude ?? c.longitude,
                    }))}
                  />
                </div>
                <label className="workspace-field">
                  <span>{t('suggestions.suggestedDay')}</span>
                  <input type="date" value={form.date} min={trip.startDate} max={trip.endDate} onChange={(event) => setForm((c) => ({ ...c, date: event.target.value }))} />
                </label>
              </>
            )}

            {form.kind === 'change' && (
              <>
                <label className="workspace-field workspace-form__wide">
                  <span>{t('suggestions.whichActivity')}</span>
                  <select value={form.targetEntityId} onChange={(event) => setForm((c) => ({ ...c, targetEntityId: event.target.value }))} required>
                    <option value="">{t('suggestions.selectActivity')}</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>{activity.date} — {activity.title}</option>
                    ))}
                  </select>
                </label>
                <label className="workspace-field">
                  <span>{t('suggestions.whatToChange')}</span>
                  <select value={form.field} onChange={(event) => setForm((c) => ({ ...c, field: event.target.value, value: '' }))}>
                    {CHANGE_FIELDS.map((field) => <option key={field.id} value={field.id}>{t(field.labelKey)}</option>)}
                  </select>
                </label>
                <label className="workspace-field">
                  <span>{t('suggestions.newValue')}</span>
                  <input
                    type={CHANGE_FIELDS.find((field) => field.id === form.field)?.inputType || 'text'}
                    step={form.field === 'amount' ? '0.01' : undefined}
                    min={form.field === 'date' ? trip.startDate : undefined}
                    max={form.field === 'date' ? trip.endDate : undefined}
                    value={form.value}
                    onChange={(event) => setForm((c) => ({ ...c, value: event.target.value }))}
                    required
                  />
                </label>
              </>
            )}

            <label className="workspace-field workspace-form__wide">
              <span>{form.kind === 'comment' ? t('suggestions.yourComment') : t('suggestions.whyLabel')}</span>
              <textarea rows="2" value={form.body} onChange={(event) => setForm((c) => ({ ...c, body: event.target.value }))} required={form.kind === 'comment'} />
            </label>
          </div>

          <div className="workspace-form__actions">
            <Button type="submit" icon="send">{t('suggestions.send')}</Button>
          </div>
        </form>
      </Card>

      {isLoading ? (
        <p className="suggestions-panel__loading">{t('common.loading')}</p>
      ) : (
        <>
          <h3 className="suggestions-panel__section">{t('suggestions.pendingTitle', { count: pending.length })}</h3>
          {pending.length === 0 ? (
            <p className="suggestions-panel__empty">{t('suggestions.noPending')}</p>
          ) : pending.map(renderCard)}

          {resolved.length > 0 && (
            <>
              <h3 className="suggestions-panel__section">{t('suggestions.resolvedTitle')}</h3>
              {resolved.map(renderCard)}
            </>
          )}
        </>
      )}
    </div>
  );
}
