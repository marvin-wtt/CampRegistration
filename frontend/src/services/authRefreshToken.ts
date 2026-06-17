import {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import refreshRequestRetry from 'src/services/refreshRequestRetry';

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

export default (axiosClient: AxiosInstance, options: RetryOptions) => {
  refreshRequestRetry<CustomAxiosError['config']>(axiosClient, {
    ...options,
    shouldSkipRetry: (config) =>
      config._retry === true ||
      config._skipRetry === true ||
      config._queued === true,
    markRetrying: (config) => {
      config._retry = true;
    },
    markQueued: (config) => {
      config._queued = true;
    },
  });
};
