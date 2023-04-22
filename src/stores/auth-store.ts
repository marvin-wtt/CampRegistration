import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { ref } from 'vue';
import { User } from 'src/types/User';
import { useRoute, useRouter } from 'vue-router';
import { useCampRegistrationsStore } from 'stores/camp/camp-registration-store';
import { useTemplateStore } from 'stores/template-store';
import { useCampsStore } from 'stores/camp/camps-store';
import { useCampDetailsStore } from 'stores/camp/camp-details-store';
import { api as requestApi } from 'boot/axios';

export const useAuthStore = defineStore('auth', () => {
  const api = useAPIService();
  const router = useRouter();
  const route = useRoute();

  const data = ref<User>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | object | null>(null);

  // Redirect to login page on unauthorized error
  requestApi.interceptors.response.use(
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
    data.value = undefined;
    isLoading.value = false;
    error.value = null;
  }

  async function login(
    email: string,
    password: string,
    remember = false
  ): Promise<void> {
    isLoading.value = true;

    try {
      await api.login(email, password, remember);

      data.value = await api.fetchAuthUser();

      // Redirect to origin or home route
      const destination =
        'origin' in route.query && typeof route.query.origin === 'string'
          ? decodeURIComponent(route.query.origin)
          : 'results';

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

    isLoading.value = false;
  }

  async function fetchData(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      data.value = await api.fetchAuthUser();
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : typeof e === 'string' ? e : 'error';
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    await api.logout();

    // Reset all stores to make sure no confidential data is kept in memory
    reset();
    useCampsStore().reset();
    useCampDetailsStore().reset();
    useCampRegistrationsStore().reset();
    useTemplateStore().reset();

    await router.push('/');
  }

  function hasResponse(e: unknown): e is { response: object } {
    return (
      e != null &&
      typeof e === 'object' &&
      'response' in e &&
      e.response != null &&
      typeof e.response === 'object'
    );
  }

  function hasResponseStatusText(
    e: unknown
  ): e is { response: { statusText: string } } {
    return (
      hasResponse(e) &&
      'statusText' in e.response &&
      e.response.statusText != null &&
      typeof e.response.statusText === 'string'
    );
  }

  function hasResponseData(e: unknown): e is { response: { data: object } } {
    return (
      hasResponse(e) &&
      'data' in e.response &&
      typeof e.response.data === 'object'
    );
  }

  function hasResponseDataErrors(
    e: unknown
  ): e is { response: { data: { errors: object } } } {
    return (
      hasResponseData(e) &&
      'error' in e.response.data &&
      typeof e.response.data.error === 'object'
    );
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
    await api.register(email, password);
  }

  async function forgotPassword(email: string) {
    await api.forgotPassword(email);
  }

  async function resetPassword(token: string, email: string, password: string) {
    await api.resetPassword(token, email, password);
  }

  return {
    data,
    error,
    isLoading,
    fetchData,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
  };
});
