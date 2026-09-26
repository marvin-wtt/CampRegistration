import {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';

type RetryError<TConfig extends InternalAxiosRequestConfig> = AxiosError & {
  config: TConfig;
};

export interface RefreshRequestRetryOptions<
  TConfig extends InternalAxiosRequestConfig,
> {
  shouldIntercept: (error: AxiosError) => boolean;
  handleTokenRefresh: () => Promise<unknown>;
  shouldSkipRetry: (config: TConfig) => boolean;
  markRetrying: (config: TConfig) => void;
  markQueued: (config: TConfig) => void;
  retryRequest?: (request: TConfig) => Promise<unknown>;
  // Distinguishes a refresh failure that actually proves the session is gone
  // (the refresh endpoint itself rejected as unauthenticated) from a
  // transport/server failure (network error, timeout, 5xx) that says nothing
  // about auth state. Defaults to always-authoritative, preserving prior
  // behavior for callers that don't care about the distinction.
  isRefreshFailureAuthoritative?: (error: unknown) => boolean;
  // Marks the original request's config when the refresh failure was NOT
  // authoritative, so a downstream handler (e.g. a 401 -> redirect-to-login
  // handler) can tell this rejection isn't proof the user is logged out.
  markNonAuthoritativeFailure?: (config: TConfig) => void;
}

export default function refreshRequestRetry<
  TConfig extends InternalAxiosRequestConfig,
>(axiosClient: AxiosInstance, options: RefreshRequestRetryOptions<TConfig>) {
  let isRefreshing = false;
  let failedQueue: {
    config: TConfig;
    resolve: () => void;
    reject: (error: unknown) => void;
  }[] = [];

  const processQueue = (error?: AxiosError, nonAuthoritative = false) => {
    failedQueue.forEach(({ config, resolve, reject }) => {
      if (error) {
        if (nonAuthoritative) {
          options.markNonAuthoritativeFailure?.(config);
        }
        reject(error);
      } else {
        resolve();
      }
    });

    failedQueue = [];
  };

  const isRetryError = (error: unknown): error is RetryError<TConfig> => {
    return isAxiosError(error) && error.config != null;
  };

  const retryRequest =
    options.retryRequest ??
    ((request: TConfig) => axiosClient.request(request));

  const interceptor = (error: unknown) => {
    if (!isRetryError(error)) {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      return Promise.reject(error);
    }

    if (!options.shouldIntercept(error)) {
      return Promise.reject(error);
    }

    if (options.shouldSkipRetry(error.config)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ config: originalRequest, resolve, reject });
      })
        .then(() => {
          options.markQueued(originalRequest);
          return retryRequest(originalRequest);
        })
        .catch(() => {
          return Promise.reject(error);
        });
    }

    options.markRetrying(originalRequest);
    isRefreshing = true;

    return new Promise((resolve, reject) => {
      options
        .handleTokenRefresh()
        .then(() => {
          processQueue();
          resolve(retryRequest(originalRequest));
        })
        .catch((err) => {
          const authoritative =
            options.isRefreshFailureAuthoritative?.(err) ?? true;
          if (!authoritative) {
            options.markNonAuthoritativeFailure?.(originalRequest);
          }
          processQueue(err, !authoritative);
          reject(error);
        })
        .finally(() => {
          isRefreshing = false;
        });
    });
  };

  axiosClient.interceptors.response.use(undefined, interceptor);
}
