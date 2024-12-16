import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import type { Profile, AuthTokens } from '@camp-registration/common/entities';
import { useRoute, useRouter } from 'vue-router';
import { useAuthBus, useCampBus } from 'src/composables/bus';
import { useServiceHandler } from 'src/composables/serviceHandler';

export const useAuthStore = defineStore('auth', () => {
  const apiService = useAPIService();
  const router = useRouter();
  const route = useRoute();
  const bus = useAuthBus();
  const campBus = useCampBus();
  const {
    data,
    isLoading,
    error,
    reset: resetDefault,
    withErrorNotification,
    withResultNotification,
    errorOnFailure,
    checkNotNullWithError,
  } = useServiceHandler<Profile>('user');

  campBus.on('create', async () => {
    await fetchUser();
  });

  campBus.on('update', async (updatedCamp) => {
    if (!data.value) {
      return;
    }

    const index = data.value?.camps.findIndex(
      (camp) => camp.id === updatedCamp.id,
    );
    if (index !== undefined && index >= 0) {
      data.value?.camps.splice(index, 1, updatedCamp);
    }
  });

  campBus.on('delete', async (campId) => {
    const index = data.value?.camps.findIndex((camp) => camp.id === campId);
    if (index !== undefined && index >= 0) {
      data.value?.camps.splice(index);
    }
  });

  let accessTokenTimer: NodeJS.Timeout | null = null;
  let isRefreshingToken = false;

  // Redirect to login page on unauthorized error
  apiService.setOnUnauthenticated(() => {
    if (route.name === 'login' || route.fullPath.startsWith('/login')) {
      return;
    }

    return router.push({
      name: 'login',
      query: {
        origin: encodeURIComponent(route.path),
      },
    });
  });

  function reset() {
    if (accessTokenTimer != null) {
      clearTimeout(accessTokenTimer);
      accessTokenTimer = null;
    }

    resetDefault();
  }

  async function init() {
    const authenticated = await refreshTokens();
    if (!authenticated) {
      return;
    }

    await fetchUser();
  }

  async function login(
    email: string,
    password: string,
    remember = false,
  ): Promise<void> {
    await errorOnFailure(async () => {
      const result = await apiService.login(email, password, remember);

      bus.emit('login', result.profile);

      handleTokenRefresh(result.tokens);

      // Redirect to origin or home route
      const destination =
        'origin' in route.query && typeof route.query.origin === 'string'
          ? decodeURIComponent(route.query.origin)
          : { name: 'management' };

      await router.push(destination);

      return result.profile;
    });
  }

  async function refreshTokens(): Promise<boolean> {
    if (isRefreshingToken) {
      return false;
    }

    try {
      isRefreshingToken = true;
      const tokens: AuthTokens = await apiService.refreshTokens();
      handleTokenRefresh(tokens);
      return true;
    } catch (ignored) {
    } finally {
      isRefreshingToken = false;
    }

    return false;
  }

  function handleTokenRefresh(tokens: AuthTokens) {
    if (tokens.refresh === undefined) {
      return;
    }

    const expires = new Date(tokens.access.expires);
    const now = Date.now();
    const refreshTime = expires.getTime() - now - 1000 * 60;
    accessTokenTimer = setTimeout(async () => {
      const tokens: AuthTokens = await apiService.refreshTokens();
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
    await errorOnFailure(async () => {
      await apiService.register(name, email, password);

      await router.push({ name: 'login' });

      // Return undefined as registration does not log in automatically
      return undefined;
    });
  }

  async function forgotPassword(email: string) {
    await withResultNotification('forgot-password', async () => {
      await apiService.forgotPassword(email);

      await router.push({ name: 'login' });
    });
  }

  async function resetPassword(password: string) {
    const email = route.query.email as string;
    const token = route.query.token as string;

    checkNotNullWithError(email);
    checkNotNullWithError(token);

    await withErrorNotification('reset-password', async () => {
      await apiService.resetPassword(token, email, password);

      await router.push({ name: 'login' });
    });
  }

  async function verifyEmail(token: string) {
    checkNotNullWithError(token);

    await withResultNotification('verify-email', async () => {
      await apiService.verifyEmail(token);
    });
  }

  return {
    user: data,
    error,
    loading: isLoading,
    init,
    reset,
    fetchUser,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
  };
});
