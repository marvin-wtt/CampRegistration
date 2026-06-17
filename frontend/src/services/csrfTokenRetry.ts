import {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import refreshRequestRetry from 'src/services/refreshRequestRetry';

const CSRF_TOKEN_HEADER = 'x-csrf-token';

type CustomAxiosError = AxiosError & {
  config: InternalAxiosRequestConfig & {
    _csrfRetry?: boolean;
    _csrfQueued?: boolean;
  };
};

interface RetryOptions {
  shouldIntercept: (error: AxiosError) => boolean;
  handleTokenRefresh: () => Promise<unknown>;
}

// Retries a request once after fetching a fresh CSRF token, so a rotated or
// expired token does not surface as an error (e.g. a lost camp registration).
// Mirrors `authRefreshToken`, but replays the request with the new token header
// instead of relying on a refreshed cookie.
// Request methods that never carry a CSRF token (and so never need priming).
const SAFE_METHODS = new Set(['get', 'head', 'options']);

export default (axiosClient: AxiosInstance, options: RetryOptions) => {
  const applyDefaultCsrfToken = (config: InternalAxiosRequestConfig) => {
    const token = axiosClient.defaults.headers.common[CSRF_TOKEN_HEADER];
    if (token != null) {
      config.headers.set(CSRF_TOKEN_HEADER, token);
    }
  };

  const retryRequest = (request: CustomAxiosError['config']) => {
    applyDefaultCsrfToken(request);

    return axiosClient.request(request);
  };

  refreshRequestRetry<CustomAxiosError['config']>(axiosClient, {
    ...options,
    shouldSkipRetry: (config) =>
      config._csrfRetry === true || config._csrfQueued === true,
    markRetrying: (config) => {
      config._csrfRetry = true;
    },
    markQueued: (config) => {
      config._csrfQueued = true;
    },
    retryRequest,
  });

  // Prime the CSRF token before the first state-changing request. Without this
  // the happy path would always incur a 403 + retry round-trip (and race the
  // token fetch on initial page load), which e2e flows that assert on the first
  // request — e.g. submitting a camp registration — depend on not happening.
  axiosClient.interceptors.request.use(async (config) => {
    const method = (config.method ?? 'get').toLowerCase();
    const hasToken =
      config.headers.has(CSRF_TOKEN_HEADER) ||
      axiosClient.defaults.headers.common[CSRF_TOKEN_HEADER] != null;

    if (SAFE_METHODS.has(method) || hasToken) {
      return config;
    }

    try {
      await options.handleTokenRefresh();
    } catch {
      // Priming failed (e.g. a transient network error fetching the token).
      // Let the request proceed anyway and fall back to the 403 + retry path
      // rather than aborting the user's request before it is even sent.
      return config;
    }

    applyDefaultCsrfToken(config);

    return config;
  });
};
