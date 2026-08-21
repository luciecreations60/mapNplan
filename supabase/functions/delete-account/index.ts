// Supabase Edge Function — account deletion (GDPR right to erasure).
//
// A browser client can never delete its own auth user: that requires the
// service role key, which must never reach the front-end. This function runs
// on Supabase's servers, verifies the caller's own access token, and deletes
// only that caller's account and data.
//
// Deploy with:  supabase functions deploy delete-account

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const ALLOWED_ORIGINS = [
  'https://luciecreations60.github.io',
  'https://mapnplan.com',
  'https://www.mapnplan.com',
  'http://localhost:5173',
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin');
  const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' };

  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing authentication token' }), { status: 401, headers });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // The identity comes from the verified token, never from the request body,
  // so a caller can only ever delete their own account.
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session' }), { status: 401, headers });
  }

  const { error: tripsError } = await admin.from('trips').delete().eq('owner_id', user.id);
  if (tripsError) {
    return new Response(JSON.stringify({ error: 'Unable to delete trip data' }), { status: 500, headers });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return new Response(JSON.stringify({ error: 'Unable to delete the account' }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ deleted: true }), { status: 200, headers });
});
