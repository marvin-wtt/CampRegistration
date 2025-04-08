import {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';

type CustomAxiosError = AxiosError & {
  config: InternalAxiosRequestConfig & {
    _retry?: boolean;
    _skipRetry?: boolean;
    _queued?: boolean;
  };
};

interface RetryOptions {
  shouldIntercept: (error: AxiosError) => boolean;
  handleTokenRefresh: () => Promise<unknown>;
}

// https://gist.github.com/Godofbrowser/bf118322301af3fc334437c683887c5f
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

  const interceptor = (error: unknown) => {
    if (!isCustomAxiosError(error)) {
      return Promise.reject(error);
    }

    if (!options.shouldIntercept(error)) {
      return Promise.reject(error);
    }

    if (
      error.config._retry ||
      error.config._skipRetry ||
      error.config._queued
    ) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          originalRequest._queued = true;
          return axiosClient.request(originalRequest);
        })
        .catch(() => {
          return Promise.reject(error);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    return new Promise((resolve, reject) => {
      options
        .handleTokenRefresh()
        .then(() => {
          processQueue();
          resolve(axiosClient.request(originalRequest));
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
};
