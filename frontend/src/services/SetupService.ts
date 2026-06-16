import { api } from 'boot/axios';
import type { Authentication } from '@camp-registration/common/entities';

/**
 * Setup (first-run admin bootstrap) API.
 *
 * The status probe is consumed only by the setup page (not a global router
 * guard), so it costs a request just when someone opens `/setup`.
 */
export async function isSetupRequired(): Promise<boolean> {
  try {
    const response = await api.get('setup');
    return response?.data?.required === true;
  } catch {
    // Fail open: a transient error must not block a legitimate first setup.
    // The backend guard still rejects a second admin with 403.
    return true;
  }
}

export async function createInitialAdmin(
  name: string,
  email: string,
  password: string,
): Promise<Authentication> {
  const response = await api.post('setup', {
    name,
    email,
    password,
  });

  return response?.data;
}
