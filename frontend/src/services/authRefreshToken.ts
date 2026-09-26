import {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';
import refreshRequestRetry from '@/services/refreshRequestRetry';

type CustomAxiosError = AxiosError & {
  config: InternalAxiosRequestConfig & {
    _retry?: boolean;
    _skipRetry?: boolean;
    _queued?: boolean;
    _skipAuthenticationHandler?: boolean;
  };
};

interface RetryOptions {
  shouldIntercept: (error: AxiosError) => boolean;
  handleTokenRefresh: () => Promise<unknown>;
}

// A failed refresh only proves the session is gone when the refresh endpoint
// itself says so: 401 (invalid/expired refresh token) or 400 (no refresh
// token was even sent, see auth.controller.ts). A 403 here is always the CSRF
// check rejecting the request (this route sits behind the global
// csrfProtection middleware, and refreshAuth() never throws 403) - not an
// auth failure. Anything else (network error, timeout, 5xx from the dev proxy
// while the backend is restarting, ...) is a transport/server hiccup that
// says nothing about auth state.
export function isRefreshFailureAuthoritative(error: unknown): boolean {
  return (
    isAxiosError(error) &&
    (error.response?.status === 400 || error.response?.status === 401)
  );
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
    isRefreshFailureAuthoritative,
    // Not proof of logout - don't let the unauthenticated handler redirect.
    markNonAuthoritativeFailure: (config) => {
      config._skipAuthenticationHandler = true;
    },
  });
};
