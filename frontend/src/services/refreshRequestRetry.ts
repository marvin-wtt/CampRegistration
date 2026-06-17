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
}

export default function refreshRequestRetry<
  TConfig extends InternalAxiosRequestConfig,
>(axiosClient: AxiosInstance, options: RefreshRequestRetryOptions<TConfig>) {
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
        failedQueue.push({ resolve, reject });
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
          processQueue(err);
          reject(error);
        })
        .finally(() => {
          isRefreshing = false;
        });
    });
  };

  axiosClient.interceptors.response.use(undefined, interceptor);
}
