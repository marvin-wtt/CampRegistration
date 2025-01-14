import { api } from 'boot/axios';
import type {
  AuthTokens,
  Authentication,
} from '@camp-registration/common/entities';
import authRefreshToken from 'src/services/authRefreshToken';
import {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';

export type CustomAxiosError = AxiosError & {
  config: InternalAxiosRequestConfig & {
    _skipRetry?: boolean;
    _skipAuthenticationHandler?: boolean;
  };
};

export const isCustomAxiosError = (
  error: unknown,
): error is CustomAxiosError => {
  return isAxiosError(error);
};

export function useAuthService() {
  // Retry failed requests after fetching a new refresh token
  authRefreshToken(api, {
    handleTokenRefresh: refreshTokens,
    shouldIntercept: (error) => error.response?.status === 401,
  });

  let onUnauthenticated: (() => unknown | Promise<unknown>) | undefined =
    undefined;
  // Interceptors are reversed for some reason. https://github.com/axios/axios/issues/1663
  api.interceptors.response.use(undefined, async (error) => {
    if (!isCustomAxiosError(error)) {
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
    const response = await api.post('auth/refresh-tokens', undefined, {
      _skipRetry: true,
      _skipAuthenticationHandler: true,
    } as AxiosRequestConfig);

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

  async function verifyOtp(
    token: string,
    otp: string,
  ): Promise<Authentication> {
    const response = await api.post('auth/verify-otp', {
      token,
      otp,
    });

    return response?.data;
  }

  function setOnUnauthenticated(handler: () => unknown | Promise<unknown>) {
    onUnauthenticated = handler;
  }

  function extractOtpTokenFromError(error: unknown): string | undefined {
    return isCustomAxiosError(error) &&
      error.response?.status === 403 &&
      error.response?.headers['www-authenticate']?.includes('OTP') &&
      error.response?.data &&
      typeof error.response?.data === 'object' &&
      'token' in error.response.data &&
      typeof error.response.data.token === 'string'
      ? error.response.data.token
      : undefined;
  }

  return {
    login,
    logout,
    verifyOtp,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
    refreshTokens,
    setOnUnauthenticated,
    extractOtpTokenFromError,
  };
}
