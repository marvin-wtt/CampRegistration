import { defineBoot } from '#q-app/wrappers';
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
  }
}

// Internal axios config flags used to coordinate the CSRF bootstrap.
type CsrfRequestConfig = InternalAxiosRequestConfig & {
  // The CSRF/session bootstrap request itself must not wait for (or be retried
  // by) the bootstrap machinery, otherwise it would deadlock / loop.
  _skipCsrfBootstrap?: boolean;
  // Marks a request that has already been retried after a CSRF failure so we
  // never retry more than once.
  _csrfRetried?: boolean;
};

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({
  baseURL: `${window.origin}/api/v1/`,
  // Needed for auth
  withCredentials: true,
});

const CSRF_HEADER = 'x-csrf-token';
const CSRF_ERROR_CODE = 'EBADCSRFTOKEN';

let csrfToken: string | null = null;
// A single in-flight bootstrap promise shared by every request. This guarantees
// that the very first request to the server establishes the session cookie
// (`__Host-session`) on its own, before any other request is sent. Without it,
// several requests fired in parallel on a cold load would each arrive without a
// session cookie, each mint a *different* session id, and race to set the
// cookie — leaving the CSRF token bound to a session id that no longer matches
// the surviving cookie. See AuthService for where the token is consumed.
let bootstrapPromise: Promise<void> | null = null;

async function fetchCsrfToken(): Promise<void> {
  const response = await api.get('auth/csrf-token', {
    _skipCsrfBootstrap: true,
  } as CsrfRequestConfig);

  const token: unknown = response?.data?.csrfToken;
  if (typeof token === 'string') {
    csrfToken = token;
    api.defaults.headers.common[CSRF_HEADER] = token;
  }
}

/**
 * Ensures a CSRF token (and therefore a stable session cookie) has been
 * established. Concurrent callers share a single network request. If the
 * bootstrap fails it is retried on the next call rather than caching the
 * failure.
 */
export function ensureCsrfToken(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = fetchCsrfToken().catch((error: unknown) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  return bootstrapPromise;
}

/**
 * Forces a fresh CSRF token to be fetched, discarding any cached bootstrap.
 * Used to recover from a stale/invalid token.
 */
export function refreshCsrfToken(): Promise<void> {
  bootstrapPromise = null;
  return ensureCsrfToken();
}

// Gate every request behind the one-time bootstrap so the session cookie is
// established exactly once before any concurrent requests are sent.
api.interceptors.request.use(async (config) => {
  const csrfConfig = config as CsrfRequestConfig;
  if (csrfConfig._skipCsrfBootstrap) {
    return config;
  }

  try {
    await ensureCsrfToken();
  } catch {
    // Bootstrap failed (e.g. offline). Let the request proceed anyway — public
    // GETs may still succeed and the error will surface on its own otherwise.
  }

  if (csrfToken !== null) {
    config.headers.set(CSRF_HEADER, csrfToken);
  }

  return config;
});

// Recover from a desynced/invalid CSRF token: fetch a fresh one and retry once.
api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || !error.config) {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(error);
  }

  const config = error.config as CsrfRequestConfig;
  const isCsrfError =
    error.response?.status === 403 &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'errorCode' in error.response.data &&
    error.response.data.errorCode === CSRF_ERROR_CODE;

  if (
    !isCsrfError ||
    config._csrfRetried ||
    config._skipCsrfBootstrap
  ) {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(error);
  }

  config._csrfRetried = true;
  try {
    await refreshCsrfToken();
  } catch {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(error);
  }

  return api.request(config);
});

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api };
