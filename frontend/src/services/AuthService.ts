import { api } from 'boot/axios';
import type {
  AuthTokens,
  Authentication,
  Profile,
} from '@camp-registration/common/entities';

export function useAuthService() {
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

    return response.data;
  }

  async function logout(): Promise<void> {
    const response = await api.post('auth/logout');

    return response.data;
  }

  async function refreshTokens(): Promise<AuthTokens> {
    const response = await api.post('auth/refresh-tokens');

    return response.data;
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

    return response.data;
  }

  async function forgotPassword(email: string): Promise<void> {
    const response = await api.post('auth/forgot-password', {
      email: email,
    });

    return response.data;
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

    return response.data;
  }

  async function fetchProfile(): Promise<Profile> {
    const response = await api.get('profile');

    return response.data.data;
  }

  return {
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    fetchProfile,
    refreshTokens,
  };
}
