import axios, { type AxiosRequestConfig } from 'axios';
import { CLIENT_ID_HEADER } from '@camp-registration/common/realtime';
import { clientId } from '@/services/clientId';

// Axios config flag used to coordinate the CSRF bootstrap: the token request
// itself must not be retried by the CSRF retry interceptor, which would loop.
type CsrfRequestConfig = AxiosRequestConfig & {
  _csrfRetry?: boolean;
};

// Shared singleton axios instance for the whole app.
const api = axios.create({
  baseURL: `${window.origin}/api/v1/`,
  // Needed for auth
  withCredentials: true,
});

// Add a custom header to identify the client type (e.g., web, mobile, etc.)
api.defaults.headers.common['X-Client-Type'] = 'web';

// Identify this app instance so the server can stamp realtime events' origin
// and this client can skip the echo of its own writes.
api.defaults.headers.common[CLIENT_ID_HEADER] = clientId;

// De-duplicates concurrent token requests so a burst of requests (or a cold
// start priming the token) only triggers a single fetch and one session cookie.
let pendingCsrfToken: Promise<void> | null = null;

// Fetches a CSRF token (establishing the session cookie) exactly once for
// concurrent callers and stores it as the default header for later requests.
export function ensureCsrfToken(): Promise<void> {
  pendingCsrfToken ??= api
    .get('auth/csrf-token', {
      // Don't let the CSRF retry interceptor re-issue the bootstrap request.
      _csrfRetry: true,
    } as CsrfRequestConfig)
    .then((response) => {
      const csrfToken: unknown = response?.data?.csrfToken;
      if (typeof csrfToken === 'string') {
        api.defaults.headers.common['x-csrf-token'] = csrfToken;
      }
    })
    .finally(() => {
      pendingCsrfToken = null;
    });

  return pendingCsrfToken;
}

export { api };
