import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { ref } from 'vue';
import { User } from 'src/types/User';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'boot/axios';
import {
  hasResponseData,
  hasResponseDataErrors,
  hasResponseStatusText,
} from 'src/composables/errorChecker';
import { useAuthBus } from 'src/composables/bus';

export const useAuthStore = defineStore('auth', () => {
  const apiService = useAPIService();
  const router = useRouter();
  const route = useRoute();

  const bus = useAuthBus();

  const user = ref<User>();
  const loading = ref<boolean>(false);
  const error = ref<string | object | null>(null);

  // Redirect to login page on unauthorized error
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async function (error) {
      // Don't redirect on login page
      if (route.name === 'login' || route.fullPath.startsWith('/login')) {
        return Promise.reject(error);
      }
      // Only capture unauthorized error
      if (error.response.status !== 401) {
        return Promise.reject(error);
      }

      bus.emit('logout');
      // Clear current user for login page
      reset();
      // TODO Why are named routes not working?
      await router.push({
        path: '/login',
        query: {
          origin: encodeURIComponent(route.path),
        },
      });

      // Still reject error to avoid false success messages
      return Promise.reject(error);
    }
  );

  function reset() {
    user.value = undefined;
    loading.value = false;
    error.value = null;
  }

  async function login(
    email: string,
    password: string,
    remember = false
  ): Promise<void> {
    loading.value = true;

    try {
      await apiService.login(email, password, remember);

      user.value = await apiService.fetchAuthUser();

      // Redirect to origin or home route
      const destination =
        'origin' in route.query && typeof route.query.origin === 'string'
          ? decodeURIComponent(route.query.origin)
          : 'results';

      bus.emit('login', user.value);

      await router.push(destination);
    } catch (e: unknown) {
      error.value = hasResponseDataErrors(e)
        ? e.response.data.errors
        : hasResponseData(e)
        ? e.response.data
        : hasResponseStatusText(e)
        ? e.response.statusText
        : e instanceof Error
        ? e.message
        : 'error';
    }

    loading.value = false;
  }

  async function fetchUser(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      user.value = await apiService.fetchAuthUser();
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : typeof e === 'string' ? e : 'error';
    } finally {
      loading.value = false;
    }
  }

  async function logout(): Promise<void> {
    await apiService.logout();

    // Reset all stores to make sure no confidential data is kept in memory
    reset();

    bus.emit('logout');

    await router.push('/');
  }

  function hasEmailErrorField(
    e: unknown
  ): e is { response: { data: { errors: { email: string } } } } {
    return (
      hasResponseDataErrors(e) &&
      'email' in e.response.data.errors &&
      typeof e.response.data.errors.email === 'string'
    );
  }

  function hasPasswordErrorField(
    e: unknown
  ): e is { response: { data: { errors: { password: string } } } } {
    return (
      hasResponseDataErrors(e) &&
      'password' in e.response.data.errors &&
      typeof e.response.data.errors.password === 'string'
    );
  }

  function hasTokenErrorField(
    e: unknown
  ): e is { response: { data: { errors: { token: string } } } } {
    return (
      hasResponseDataErrors(e) &&
      'token' in e.response.data.errors &&
      typeof e.response.data.errors.token === 'string'
    );
  }

  async function register(email: string, password: string) {
    // TODO Progress
    await apiService.register(email, password);
    // TODO emit event
  }

  async function forgotPassword(email: string) {
    // TODO Progress
    await apiService.forgotPassword(email);
    // TODO emit event
  }

  async function resetPassword(token: string, email: string, password: string) {
    // TODO Progress
    await apiService.resetPassword(token, email, password);
    // TODO emit event
  }

  return {
    user,
    error,
    loading,
    fetchUser,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
  };
});
