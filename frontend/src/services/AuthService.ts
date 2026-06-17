import { api, ensureCsrfToken } from 'src/services/api';
import type {
  AuthTokens,
  Authentication,
} from '@camp-registration/common/entities';
import authRefreshToken from 'src/services/authRefreshToken';
import csrfTokenRetry from 'src/services/csrfTokenRetry';
import { type AxiosError, type AxiosRequestConfig, isAxiosError } from 'axios';

export type CustomRequestConfig = AxiosRequestConfig & {
  _skipRetry?: boolean;
  _skipAuthenticationHandler?: boolean | undefined;
  _csrfRetry?: boolean | undefined;
};

export type CustomAxiosError = AxiosError & {
  config: CustomRequestConfig;
};

let retryInterceptorsInstalled = false;
let onUnauthenticated: (() => unknown) | undefined = undefined;

function isCsrfError(error: AxiosError): boolean {
  if (error.response?.status !== 403) {
    return false;
  }

  const data = error.response.data as { errorCode?: unknown } | undefined;

  return data?.errorCode === 'EBADCSRFTOKEN';
}

function installRetryInterceptors(
  refreshTokens: () => Promise<AuthTokens>,
  requestCsrfToken: () => Promise<void>,
) {
  if (retryInterceptorsInstalled) {
    return;
  }

  // Retry failed requests after fetching a new refresh token
  authRefreshToken(api, {
    handleTokenRefresh: refreshTokens,
    shouldIntercept: (error) => error.response?.status === 401,
  });

  // Retry failed requests after fetching a new CSRF token
  csrfTokenRetry(api, {
    handleTokenRefresh: requestCsrfToken,
    shouldIntercept: isCsrfError,
  });

  // Invoke the registered unauthenticated handler on 401. Installed once here
  // (not per `useAuthService()` call) so the interceptor doesn't accumulate on
  // the shared `api` instance every time a component resolves the service.
  // Interceptors are reversed for some reason. https://github.com/axios/axios/issues/1663
  api.interceptors.response.use(undefined, async (error) => {
    if (!isCustomAxiosError(error)) {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (error.config._skipAuthenticationHandler) {
      return Promise.reject(error);
    }

    if (onUnauthenticated) {
      await onUnauthenticated();
    }

    return Promise.reject(error);
  });

  retryInterceptorsInstalled = true;
}

export const extendAxiosConfig = (
  config: CustomRequestConfig,
): CustomRequestConfig => {
  return config;
};

export const isCustomAxiosError = (
  error: unknown,
): error is CustomAxiosError => {
  return isAxiosError(error);
};

export function useAuthService() {
  installRetryInterceptors(refreshTokens, requestCsrfToken);

  async function login(
    email: string,
    password: string,
    remember = false,
  ): Promise<Authentication> {
    const response = await api.post('auth/login', {
      email,
      password,
      remember,
    });

    return response?.data;
  }

  async function logout(): Promise<void> {
    const response = await api.post('auth/logout');

    return response?.data;
  }

  async function refreshTokens(): Promise<AuthTokens> {
    await requestCsrfToken();

    const response = await api.post('auth/refresh-tokens', undefined, {
      _skipRetry: true,
      _skipAuthenticationHandler: true,
      // We already primed the CSRF token above; don't let the CSRF retry
      // interceptor re-fetch and replay this request on a 403.
      _csrfRetry: true,
    } as CustomRequestConfig);

    return response?.data;
  }

  async function register(
    name: string,
    email: string,
    password: string,
  ): Promise<void> {
    const response = await api.post('auth/register', {
      name,
      email,
      password,
    });

    return response?.data;
  }

  async function forgotPassword(email: string): Promise<void> {
    const response = await api.post('auth/forgot-password', {
      email,
    });

    return response?.data;
  }

  async function resetPassword(
    token: string,
    email: string,
    password: string,
  ): Promise<void> {
    const response = await api.post('auth/reset-password', {
      token,
      email,
      password,
    });

    return response?.data;
  }

  async function verifyEmail(token: string): Promise<void> {
    await api.post('auth/verify-email', {
      token,
    });
  }

  async function sendEmailVerify(token: string): Promise<void> {
    await api.post('auth/send-verification-email', {
      token,
    });
  }

  async function verifyOtp(
    token: string,
    otp: string,
    remember?: boolean,
  ): Promise<Authentication> {
    const response = await api.post('auth/verify-otp', {
      token,
      otp,
      remember,
    });

    return response?.data;
  }

  async function requestCsrfToken(): Promise<void> {
    // Delegates to the shared bootstrap in services/api so the session cookie
    // and CSRF token are established exactly once and stay in sync across callers.
    await ensureCsrfToken();
  }

  function setOnUnauthenticated(handler: () => unknown) {
    onUnauthenticated = handler;
  }

  interface PartialAuthResponse {
    token: string;
    partialAuthType: string;
  }

  interface PartialAuthError {
    response: {
      status: 403;
      data: PartialAuthResponse;
    };
  }

  function extractPartialAuthResponse(
    error: unknown,
  ): PartialAuthResponse | undefined {
    return isPartialAuthResponse(error) ? error.response.data : undefined;
  }

  function isPartialAuthResponse(error: unknown): error is PartialAuthError {
    return (
      isCustomAxiosError(error) &&
      // Forbidden
      error.response?.status === 403 &&
      // Data
      error.response?.data != null &&
      typeof error.response?.data === 'object' &&
      // Status
      'status' in error.response.data &&
      error.response.data.status === 'PARTIAL_AUTH' &&
      // Partial auth type
      'partialAuthType' in error.response.data &&
      typeof error.response.data.partialAuthType === 'string' &&
      // Token
      'token' in error.response.data &&
      typeof error.response.data.token === 'string'
    );
  }

  return {
    login,
    logout,
    verifyOtp,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
    sendEmailVerify,
    refreshTokens,
    setOnUnauthenticated,
    requestCsrfToken,
    extractPartialAuthResponse,
  };
}
