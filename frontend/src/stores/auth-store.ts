import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import type {
  AuthTokens,
  Authentication,
} from '@camp-registration/common/entities';
import { useRoute, useRouter } from 'vue-router';
import { useAuthBus } from '@/composables/bus';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useProfileStore } from '@/stores/profile-store';
import { createInitialAdmin } from '@/services/SetupService';
import { isCustomAxiosError } from '@/services/AuthService';

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

  let partialAuthToken: string | undefined = undefined;

  let accessTokenTimer: NodeJS.Timeout | null = null;
  let ongoingRefresh: Promise<boolean> | null = null;

  router.beforeEach((to) => {
    if (
      !to.meta.auth ||
      isLoading.value ||
      profileStore.loading ||
      profileStore.user
    ) {
      return;
    }

    return buildLoginRoute();
  });

  // Redirect to the login page on unauthorized error
  apiService.setOnUnauthenticated(() => {
    if (route.name === 'login' || route.fullPath.startsWith('/login')) {
      return;
    }

    return redirectToLogin();
  });

  async function redirectToLogin() {
    return router.push(buildLoginRoute());
  }

  function buildLoginRoute() {
    return {
      name: 'login',
      query: {
        origin: encodeURIComponent(route.fullPath),
      },
      replace: false,
    };
  }

  function reset() {
    if (accessTokenTimer != null) {
      clearTimeout(accessTokenTimer);
      accessTokenTimer = null;
    }

    resetDefault();
  }

  async function init(forceRefresh = false) {
    if (profileStore.user && !forceRefresh) {
      return;
    }

    const authenticated = await refreshTokens();
    if (!authenticated) {
      // Redirect, in case the user is not authenticated
      if (route.meta.auth) {
        await redirectToLogin();
      }
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
        const response = apiService.extractPartialAuthResponse(error);
        if (!response) {
          throw error;
        }

        partialAuthToken = response.token;
        if (partialAuthToken === undefined) {
          throw error;
        }

        switch (response.partialAuthType) {
          case 'TOTP_REQUIRED':
            await router.push({
              name: 'verify-otp',
              query: {
                origin: route.query.origin,
                remember: remember ? 'true' : undefined,
              },
            });
            break;
          case 'EMAIL_NOT_VERIFIED':
            await router.push({
              name: 'verify-email',
            });
            break;
          default:
            throw error;
        }
      }
    });
  }

  async function verifyOtp(otp: string) {
    checkNotNullWithError(otp);

    const token = partialAuthToken;
    if (token === undefined) {
      await router.push({
        name: 'login',
        query: route.query,
      });
      return;
    }

    const remember = route.query.remember === 'true';

    await errorOnFailure(async () => {
      const result = await apiService.verifyOtp(token, otp, remember);

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
        : { name: 'management.camps' };

    await router.push(destination);
  }

  async function refreshTokens(): Promise<boolean> {
    // if there’s already a refresh in progress, return its promise
    if (ongoingRefresh) {
      return ongoingRefresh;
    }

    isLoading.value = true;

    ongoingRefresh = apiService
      .refreshTokens()
      .then(handleTokenRefresh)
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        // allow a new refresh after this one settles
        ongoingRefresh = null;
        isLoading.value = false;
      });

    return ongoingRefresh;
  }

  function handleTokenRefresh(tokens: AuthTokens) {
    if (tokens.refresh === undefined) {
      return;
    }

    const expires = new Date(tokens.access.expires);
    const now = Date.now();
    const refreshTime = expires.getTime() - now - 1000 * 60;
    accessTokenTimer = setTimeout(() => {
      // eslint-disable-next-line no-console
      refreshTokens().catch(console.error);
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

  async function setup(
    name: string,
    email: string,
    password: string,
  ): Promise<'ok' | 'closed'> {
    let outcome: 'ok' | 'closed' = 'ok';

    await errorOnFailure(async () => {
      // The web client is CSRF-protected, and init() (which normally seeds the
      // token) does not run on the setup screen — fetch one explicitly.
      await apiService.requestCsrfToken();

      try {
        const result = await createInitialAdmin(name, email, password);

        await handleAuthentication(result);
      } catch (e) {
        // Instance already has an admin: setup is closed. Report it to the
        // caller (the setup page handles the redirect) without surfacing an
        // error message.
        if (isCustomAxiosError(e) && e.response?.status === 403) {
          outcome = 'closed';
          return;
        }
        throw e;
      }
    });

    return outcome;
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

  async function sendVerifyEmail() {
    const token = partialAuthToken;
    if (token === undefined) {
      await router.push({
        name: 'login',
        query: route.query,
      });
      return;
    }

    await errorOnFailure(async () => {
      await apiService.sendEmailVerify(token);
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
    setup,
    forgotPassword,
    resetPassword,
    verifyEmail,
    sendVerifyEmail,
    verifyOtp,
  };
});
