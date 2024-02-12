import { api } from 'boot/axios';
import type {
  AuthTokens,
  Authentication,
  Profile,
} from '@camp-registration/common/entities';
import authRefreshToken from 'src/services/authRefreshToken';
import { AxiosRequestConfig, isAxiosError } from 'axios';

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
    if (!isAxiosError(error)) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (
      error.config &&
      '_skipAuthenticationHandler' in error.config &&
      !error.config._skipAuthenticationHandler
    ) {
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
      email: email,
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

  async function fetchProfile(): Promise<Profile> {
    const response = await api.get('profile');

    return response?.data?.data;
  }

  function setOnUnauthenticated(handler: () => unknown | Promise<unknown>) {
    onUnauthenticated = handler;
  }

  return {
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
    fetchProfile,
    refreshTokens,
    setOnUnauthenticated,
  };
}
