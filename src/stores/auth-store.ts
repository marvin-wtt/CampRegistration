import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { User } from 'src/types/User';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'boot/axios';
import { useAuthBus } from 'src/composables/bus';
import { AccessTokens } from 'src/types/AccessTokens';
import { useServiceHandler } from 'src/composables/serviceHandler';

export const useAuthStore = defineStore('auth', () => {
  const apiService = useAPIService();
  const router = useRouter();
  const route = useRoute();

  const bus = useAuthBus();

  const {
    data,
    isLoading,
    error,
    reset: resetDefault,
    withErrorNotification,
    withResultNotification,
    errorOnFailure,
  } = useServiceHandler<User>('user');

  let accessTokenTimer: NodeJS.Timeout | null = null;
  let isRefreshingToken = false;

  // Redirect to login page on unauthorized error
  // TODO Avoid using axios here.
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async function (error) {
      if (error.response === undefined) {
        return Promise.reject(
          'Server not reachable... Please try again later :('
        );
      }

      // Don't redirect on login page
      if (route.name === 'login' || route.fullPath.startsWith('/login')) {
        return Promise.reject(error);
      }
      // Only capture unauthorized error
      if (error.response.status !== 401) {
        return Promise.reject(error);
      }

      const authenticated = await refreshTokens();
      if (authenticated) {
        return Promise.resolve();
      }

      bus.emit('logout');
      // Clear current user for login page
      reset();

      if (!route.path.startsWith('/login')) {
        // TODO Why are named routes not working?
        await router.push({
          path: '/login',
          query: {
            origin: encodeURIComponent(route.path),
          },
        });
      }

      // Still reject error to avoid false success messages
      return Promise.reject(error);
    }
  );

  function reset() {
    if (accessTokenTimer != null) {
      clearTimeout(accessTokenTimer);
      accessTokenTimer = null;
    }

    resetDefault();
  }

  async function login(
    email: string,
    password: string,
    remember = false
  ): Promise<void> {
    await errorOnFailure(async () => {
      const result = await apiService.login(email, password, remember);

      bus.emit('login', result.user);

      handleTokenRefresh(result.tokens);

      // Redirect to origin or home route
      const destination =
        'origin' in route.query && typeof route.query.origin === 'string'
          ? decodeURIComponent(route.query.origin)
          : 'campManagement';

      await router.push(destination);

      return result.user;
    });
  }

  async function refreshTokens(): Promise<boolean> {
    if (isRefreshingToken) {
      return false;
    }

    try {
      isRefreshingToken = true;
      const tokens: AccessTokens = await apiService.refreshTokens();
      handleTokenRefresh(tokens);
      return true;
    } catch (ignored) {
    } finally {
      isRefreshingToken = false;
    }

    return false;
  }

  function handleTokenRefresh(tokens: AccessTokens) {
    if (tokens.refresh === undefined) {
      return;
    }

    const expires = new Date(tokens.access.expires);
    const now = Date.now();
    const refreshTime = expires.getTime() - now - 1000 * 60;
    accessTokenTimer = setTimeout(async () => {
      const tokens: AccessTokens = await apiService.refreshTokens();
      handleTokenRefresh(tokens);
    }, refreshTime);
  }

  async function fetchUser(): Promise<void> {
    await errorOnFailure(async () => {
      return await apiService.fetchProfile();
    });
  }

  async function logout(): Promise<void> {
    await withErrorNotification('logout', async () => {
      await apiService.logout();

      reset();

      bus.emit('logout');
    });

    await router.push('/');
  }

  async function register(name: string, email: string, password: string) {
    await withResultNotification('register', async () => {
      await apiService.register(name, email, password);
    });
  }

  async function forgotPassword(email: string) {
    await withErrorNotification('forgot-password', async () => {
      await apiService.forgotPassword(email);
    });
  }

  async function resetPassword(token: string, email: string, password: string) {
    await withErrorNotification('reset-password', async () => {
      await apiService.resetPassword(token, email, password);
    });
  }

  return {
    user: data,
    error,
    loading: isLoading,
    fetchUser,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
  };
});
