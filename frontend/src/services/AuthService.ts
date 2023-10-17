import { api } from 'boot/axios';
import { User } from 'src/types/User';
import { LoginResponse } from 'src/types/LoginResponse';
import { AccessTokens } from 'src/types/AccessTokens';

export function useAuthService() {
  async function login(
    email: string,
    password: string,
    remember = false,
  ): Promise<LoginResponse> {
    const response = await api.post('auth/login', {
      email: email,
      password: password,
      remember: remember,
    });

    return response.data;
  }

  async function logout(): Promise<void> {
    const response = await api.post('auth/logout');

    return response.data;
  }

  async function refreshTokens(): Promise<AccessTokens> {
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
      token: token,
      email: email,
      password: password,
    });

    return response.data;
  }

  async function fetchProfile(): Promise<User> {
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
