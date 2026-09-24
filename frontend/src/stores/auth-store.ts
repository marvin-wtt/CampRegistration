import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import type {
  AuthTokens,
  Authentication,
  Profile,
} from '@camp-registration/common/entities';
import { useRoute, useRouter } from 'vue-router';
import { useAuthBus } from '@/composables/bus';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useProfileStore } from '@/stores/profile-store';
import { createInitialAdmin } from '@/services/SetupService';
import { isCustomAxiosError } from '@/services/AuthService';
import { isRefreshFailureAuthoritative } from '@/services/authRefreshToken';
import { retryAfterMs } from '@/utils/retryAfter';
import { computed, ref } from 'vue';
import { Dialog } from 'quasar';
import TwoFactorSuggestionDialog from '@/components/settings/twoFactor/TwoFactorSuggestionDialog.vue';

const TWO_FACTOR_SUGGESTION_DISMISSED_KEY = 'two-factor-suggestion-dismissed';
const BASE_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 60_000;

// 'unknown' until the first refresh settles, or while the server can't answer.
export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';
export type RefreshOutcome =
  'authenticated' | 'unauthenticated' | 'unavailable';

type RefreshResult =
  | { outcome: 'authenticated' | 'unauthenticated' }
  | { outcome: 'unavailable'; error: unknown };

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
    showErrorNotification,
  } = useServiceHandler<void>('auth');

  const status = ref<AuthStatus>('unknown');

  let partialAuthToken: string | undefined = undefined;

  let accessTokenTimer: ReturnType<typeof setTimeout> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let retryAttempt = 0;

  // Only a confirmed logout blocks navigation; while 'unknown', the layout's
  // init() decides once the session state is known.
  router.beforeEach((to) => {
    if (!to.meta.auth || status.value !== 'unauthenticated') {
      return;
    }

    return buildLoginRoute(to.fullPath);
  });

  // An API request failed with 401 and the refresh confirmed the session is gone
  apiService.setOnUnauthenticated(() => {
    status.value = 'unauthenticated';

    if (route.name === 'login' || route.fullPath.startsWith('/login')) {
      return;
    }

    return redirectToLogin();
  });

  apiService.setOnTokenRefresh(scheduleProactiveRefresh);

  bus.on('login', () => {
    status.value = 'authenticated';
    stopRetry();
  });

  bus.on('logout', () => {
    status.value = 'unauthenticated';
    stopRetry();
    stopProactiveRefresh();
  });

  async function redirectToLogin() {
    return router.push(buildLoginRoute(route.fullPath));
  }

  function buildLoginRoute(origin: string) {
    return {
      name: 'login',
      query: {
        origin: encodeURIComponent(origin),
      },
      replace: false,
    };
  }

  // Clears form state only; the session timers outlive the auth pages
  function reset() {
    resetDefault();
  }

  function stopRetry() {
    clearTimeout(retryTimer);
    retryTimer = undefined;
    retryAttempt = 0;
  }

  function stopProactiveRefresh() {
    clearTimeout(accessTokenTimer);
    accessTokenTimer = undefined;
  }

  async function init(forceRefresh = false) {
    if (profileStore.user && !forceRefresh) {
      return;
    }

    const result = await tryRefresh();
    if (result.outcome === 'unavailable') {
      retryLater(() => init(), result.error);
      return;
    }

    if (result.outcome === 'authenticated') {
      await profileStore.fetchProfile();
    }
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

    scheduleProactiveRefresh(auth.tokens);

    // Redirect to origin or home route
    const destination =
      'origin' in route.query && typeof route.query.origin === 'string'
        ? decodeURIComponent(route.query.origin)
        : { name: 'management.events' };

    await router.push(destination);

    maybeSuggestTwoFactor(auth.profile);
  }

  function maybeSuggestTwoFactor(profile: Profile) {
    if (profile.twoFactorEnabled) {
      return;
    }

    if (localStorage.getItem(TWO_FACTOR_SUGGESTION_DISMISSED_KEY) === 'true') {
      return;
    }

    Dialog.create({
      component: TwoFactorSuggestionDialog,
    }).onOk((result: { enable: boolean; dontRemind: boolean }) => {
      if (result.dontRemind) {
        localStorage.setItem(TWO_FACTOR_SUGGESTION_DISMISSED_KEY, 'true');
      }

      if (result.enable) {
        void router.push({ name: 'settings.security' });
      }
    });
  }

  async function refreshTokens(): Promise<RefreshOutcome> {
    return (await tryRefresh()).outcome;
  }

  // Only a 400/401 from the refresh endpoint proves the session is gone; a
  // 429, 5xx or network error leaves the status untouched.
  async function tryRefresh(): Promise<RefreshResult> {
    isLoading.value = true;

    try {
      // Deduped in AuthService, so concurrent callers share one request
      await apiService.refreshTokens();
      status.value = 'authenticated';
      // A pending init() retry still has to load the profile, so keep its timer
      retryAttempt = 0;

      return { outcome: 'authenticated' };
    } catch (error) {
      if (!isRefreshFailureAuthoritative(error)) {
        return { outcome: 'unavailable', error };
      }

      status.value = 'unauthenticated';
      stopRetry();
      if (route.meta.auth) {
        await redirectToLogin();
      }

      return { outcome: 'unauthenticated' };
    } finally {
      isLoading.value = false;
    }
  }

  function retryLater(task: () => Promise<unknown>, error: unknown) {
    if (retryAttempt === 0) {
      showErrorNotification('refresh');
    }

    const delay =
      retryAfterMs(error) ??
      Math.min(BASE_RETRY_DELAY_MS * 2 ** retryAttempt, MAX_RETRY_DELAY_MS);
    retryAttempt++;

    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      void task();
    }, delay);
  }

  async function refreshInBackground() {
    const result = await tryRefresh();
    if (result.outcome === 'unavailable') {
      retryLater(refreshInBackground, result.error);
    }
  }

  function scheduleProactiveRefresh(tokens: AuthTokens) {
    if (tokens.refresh === undefined) {
      return;
    }

    // Every refresh path lands here, so replace the pending timer
    stopProactiveRefresh();

    const expires = new Date(tokens.access.expires);
    const refreshTime = expires.getTime() - Date.now() - 1000 * 60;
    accessTokenTimer = setTimeout(() => {
      accessTokenTimer = undefined;
      void refreshInBackground();
    }, refreshTime);
  }

  async function logout(): Promise<void> {
    await withErrorNotification('logout', async () => {
      await apiService.logout();

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
    status: computed(() => status.value),
    init,
    reset,
    refreshTokens,
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
