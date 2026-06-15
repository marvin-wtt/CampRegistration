import {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';

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
export default (axiosClient: AxiosInstance, options: RetryOptions) => {
  let isRefreshing = false;
  let failedQueue: {
    resolve: () => void;
    reject: (error: unknown) => void;
  }[] = [];

  const processQueue = (error?: AxiosError) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });

    failedQueue = [];
  };

  const isCustomAxiosError = (error: unknown): error is CustomAxiosError => {
    return isAxiosError(error);
  };

  const retryRequest = (request: CustomAxiosError['config']) => {
    const token = axiosClient.defaults.headers.common[CSRF_TOKEN_HEADER];
    if (token != null) {
      request.headers.set(CSRF_TOKEN_HEADER, token);
    }

    return axiosClient.request(request);
  };

  const interceptor = (error: unknown) => {
    if (!isCustomAxiosError(error)) {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      return Promise.reject(error);
    }

    if (!options.shouldIntercept(error)) {
      return Promise.reject(error);
    }

    if (error.config._csrfRetry || error.config._csrfQueued) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          originalRequest._csrfQueued = true;
          return retryRequest(originalRequest);
        })
        .catch(() => {
          return Promise.reject(error);
        });
    }

    originalRequest._csrfRetry = true;
    isRefreshing = true;

    return new Promise((resolve, reject) => {
      options
        .handleTokenRefresh()
        .then(() => {
          processQueue();
          resolve(retryRequest(originalRequest));
        })
        .catch((err) => {
          processQueue(err);
          reject(error);
        })
        .finally(() => {
          isRefreshing = false;
        });
    });
  };

  // Prime the CSRF token before the first state-changing request. Without this
  // the happy path would always incur a 403 + retry round-trip (and race the
  // token fetch on initial page load), which e2e flows that assert on the first
  // request — e.g. submitting a camp registration — depend on not happening.
  const SAFE_METHODS = new Set(['get', 'head', 'options']);
  axiosClient.interceptors.request.use(async (config) => {
    const method = (config.method ?? 'get').toLowerCase();
    const hasToken =
      config.headers.has(CSRF_TOKEN_HEADER) ||
      axiosClient.defaults.headers.common[CSRF_TOKEN_HEADER] != null;

    if (SAFE_METHODS.has(method) || hasToken) {
      return config;
    }

    await options.handleTokenRefresh();

    const token = axiosClient.defaults.headers.common[CSRF_TOKEN_HEADER];
    if (token != null) {
      config.headers.set(CSRF_TOKEN_HEADER, token);
    }

    return config;
  });

  axiosClient.interceptors.response.use(undefined, interceptor);
};
