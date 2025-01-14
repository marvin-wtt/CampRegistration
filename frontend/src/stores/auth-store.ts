import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import type {
  AuthTokens,
  Authentication,
} from '@camp-registration/common/entities';
import { useRoute, useRouter } from 'vue-router';
import { useAuthBus } from 'src/composables/bus';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useProfileStore } from 'stores/profile-store';

export const useAuthStore = defineStore('auth', () => {
  const apiService = useAPIService();
  const router = useRouter();
  const route = useRoute();
  const bus = useAuthBus();
  const profileStore = useProfileStore();
  const {
    isLoading,
    error,
    reset: resetDefault,
    withErrorNotification,
    withResultNotification,
    errorOnFailure,
    checkNotNullWithError,
  } = useServiceHandler<void>('auth');

  let otpToken: string | undefined = undefined;

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

    await profileStore.fetchProfile();
  }

  async function login(
    email: string,
    password: string,
    remember = false,
  ): Promise<void> {
    return errorOnFailure(async () => {
      try {
        const result = await apiService.login(email, password, remember);

        await handleAuthentication(result);
      } catch (error) {
        otpToken = apiService.extractOtpTokenFromError(error);

        if (otpToken === undefined) {
          throw error;
        }

        await router.push({
          name: 'verify-otp',
          query: {
            origin: route.query.origin,
            remember: remember ? 1 : 0,
          },
        });
      }
    });
  }

  async function verifyOtp(otp: string) {
    checkNotNullWithError(otp);

    const token = otpToken;
    if (token === undefined) {
      await router.push({
        name: 'login',
        query: route.query,
      });
      return;
    }

    await errorOnFailure(async () => {
      const result = await apiService.verifyOtp(token, otp);

      await handleAuthentication(result);
    });
  }

  async function handleAuthentication(auth: Authentication) {
    bus.emit('login', auth.profile);

    handleTokenRefresh(auth.tokens);

    // Redirect to origin or home route
    const destination =
      'origin' in route.query && typeof route.query.origin === 'string'
        ? decodeURIComponent(route.query.origin)
        : { name: 'management' };

    await router.push(destination);
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (ignored) {
      /* empty */
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
    error,
    loading: isLoading,
    init,
    reset,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
    verifyOtp,
  };
});
