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
import { ref } from 'vue';

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
  let ongoingInit: Promise<void> | null = null;
  
  // Track if auth is being initialized to prevent premature router redirects
  const isInitializing = ref(false);

  router.beforeEach(async (to) => {
    // Allow navigation for non-protected routes
    if (!to.meta.auth) {
      return;
    }

    // Allow navigation if user is already authenticated or profile is loading
    if (profileStore.user || profileStore.loading) {
      return;
    }

    // If auth initialization is not in progress, start it and wait for completion
    if (!ongoingInit) {
      ongoingInit = init();
    }
    
    await ongoingInit;

    // After initialization, check if user is now authenticated
    if (profileStore.user) {
      return; // Allow navigation
    }

    // If still not authenticated after initialization, redirect to login
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
        origin: encodeURIComponent(route.path),
      },
    };
  }

  function reset() {
    if (accessTokenTimer != null) {
      clearTimeout(accessTokenTimer);
      accessTokenTimer = null;
    }

    isInitializing.value = false;
    ongoingInit = null;
    resetDefault();
  }

  async function init() {
    // If already initializing, wait for the existing initialization to complete
    if (ongoingInit) {
      return ongoingInit;
    }

    // Create the initialization promise
    ongoingInit = (async () => {
      isInitializing.value = true;
      
      try {
        const authenticated = await refreshTokens();
        if (!authenticated) {
          // Don't redirect from init - let the router guard handle this
          return;
        }

        await profileStore.fetchProfile();
      } finally {
        isInitializing.value = false;
      }
    })();

    return ongoingInit;
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
        : { name: 'management' };

    await router.push(destination);
  }

  async function refreshTokens(): Promise<boolean> {
    // if there’s already a refresh in progress, return its promise
    if (ongoingRefresh) {
      return ongoingRefresh;
    }

    ongoingRefresh = apiService
      .requestCsrfToken()
      .then(() => apiService.refreshTokens())
      .then(handleTokenRefresh)
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        // allow a new refresh after this one settles
        ongoingRefresh = null;
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
    accessTokenTimer = setTimeout(refreshTokens, refreshTime);
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
    isInitializing,
    init,
    reset,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
    sendVerifyEmail,
    verifyOtp,
  };
});
