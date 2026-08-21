import { supabase } from '../../config/supabase.config.js';

/**
 * GDPR account deletion.
 *
 * Deletion is irreversible and covers both sides of the application: the
 * server-side account and trips, and everything held locally on this device.
 * The remote call goes through an Edge Function because deleting an auth user
 * requires privileges that must never exist in the browser.
 */
export async function deleteAccount() {
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data?.session?.access_token;
  if (error || !accessToken) throw new Error('No active session.');

  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${baseUrl}/functions/v1/delete-account`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Account deletion failed.');
  }

  return response.json();
}
