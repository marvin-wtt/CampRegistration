import { api, apiUrl } from 'boot/axios';
import { User } from 'src/types/User';

export function useLoginService() {
  async function login(
    email: string,
    password: string,
    remember = false
  ): Promise<void> {
    await api.get('/sanctum/csrf-cookie', {
      baseURL: apiUrl,
    });

    const response = await api.post('/login', {
      email: email,
      password: password,
      remember: remember,
    });

    return response.data;
  }

  async function logout(): Promise<void> {
    const response = await api.post('logout');

    return response.data;
  }

  async function register(email: string, password: string): Promise<void> {
    const response = await api.post('register', {
      email: email,
      password: password,
    });

    return response.data;
  }

  async function forgotPassword(email: string): Promise<void> {
    const response = await api.post('forgot-password', {
      email: email,
    });

    return response.data;
  }

  async function resetPassword(
    token: string,
    email: string,
    password: string
  ): Promise<void> {
    const response = await api.post('reset-password', {
      token: token,
      email: email,
      password: password,
    });

    return response.data;
  }

  async function fetchAuthUser(): Promise<User> {
    const response = await api.get('user');

    return response.data.data;
  }

  return {
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    fetchAuthUser,
  };
}
