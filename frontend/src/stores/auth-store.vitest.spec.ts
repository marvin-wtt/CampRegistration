import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { AxiosError, AxiosHeaders } from 'axios';
import { EventBus } from 'quasar';
import { useAuthStore } from '@/stores/auth-store';

const mocks = vi.hoisted(() => ({
  refreshTokens: vi.fn(),
  logout: vi.fn(),
  fetchProfile: vi.fn(),
  showErrorNotification: vi.fn(),
  push: vi.fn(),
  route: {
    meta: { auth: true },
    fullPath: '/events',
    name: 'events',
    query: {},
  },
  bus: undefined as EventBus | undefined,
}));

vi.mock('@/services/APIService', () => ({
  useAPIService: () => ({
    refreshTokens: mocks.refreshTokens,
    logout: mocks.logout,
    setOnUnauthenticated: vi.fn(),
    setOnTokenRefresh: vi.fn(),
  }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ beforeEach: vi.fn(), push: mocks.push }),
  useRoute: () => mocks.route,
}));

vi.mock('@/composables/bus', () => ({
  useAuthBus: () => mocks.bus,
}));

vi.mock('@/composables/serviceHandler', async () => {
  const { ref } = await import('vue');

  return {
    useServiceHandler: () => ({
      isLoading: ref(false),
      error: ref(),
      reset: vi.fn(),
      // Mirrors the real implementation's contract: swallow the error and
      // resolve to undefined, since callers (e.g. logout()) branch on that.
      withErrorNotification: vi.fn(async (_op: string, fn: () => unknown) => {
        try {
          return await fn();
        } catch {
          return undefined;
        }
      }),
      withResultNotification: vi.fn(),
      errorOnFailure: vi.fn(),
      checkNotNullWithError: vi.fn(),
      showErrorNotification: mocks.showErrorNotification,
    }),
  };
});

vi.mock('@/stores/profile-store', () => ({
  useProfileStore: () => ({
    user: undefined,
    fetchProfile: mocks.fetchProfile,
  }),
}));

vi.mock('@/services/SetupService', () => ({ createInitialAdmin: vi.fn() }));
vi.mock('@/services/AuthService', () => ({ isCustomAxiosError: vi.fn() }));
vi.mock(
  '@/components/settings/twoFactor/TwoFactorSuggestionDialog.vue',
  () => ({ default: {} }),
);

function httpError(status: number, retryAfter?: string): AxiosError {
  const headers = new AxiosHeaders();
  if (retryAfter !== undefined) {
    headers.set('retry-after', retryAfter);
  }

  return new AxiosError('Request failed', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    headers,
    config: { headers: new AxiosHeaders() },
    data: undefined,
  });
}

describe('auth store refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.bus = new EventBus();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the status unknown and retries with backoff while the server is unavailable', async () => {
    mocks.refreshTokens
      .mockRejectedValueOnce(httpError(503))
      .mockRejectedValueOnce(httpError(503))
      .mockResolvedValueOnce({});
    const store = useAuthStore();

    await store.init();
    expect(store.status).toBe('unknown');
    expect(mocks.push).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5_000);
    expect(mocks.refreshTokens).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(9_999);
    expect(mocks.refreshTokens).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);

    expect(mocks.refreshTokens).toHaveBeenCalledTimes(3);
    expect(store.status).toBe('authenticated');
    expect(mocks.fetchProfile).toHaveBeenCalledOnce();
    expect(mocks.showErrorNotification).toHaveBeenCalledOnce();
  });

  it('honours Retry-After on a rate-limited refresh', async () => {
    mocks.refreshTokens
      .mockRejectedValueOnce(httpError(429, '30'))
      .mockResolvedValueOnce({});
    const store = useAuthStore();

    await store.init();
    await vi.advanceTimersByTimeAsync(29_999);
    expect(mocks.refreshTokens).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.refreshTokens).toHaveBeenCalledTimes(2);
  });

  it('redirects to login once the refresh endpoint rejects the session', async () => {
    mocks.refreshTokens.mockRejectedValue(httpError(401));
    const store = useAuthStore();

    await store.init();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(store.status).toBe('unauthenticated');
    expect(mocks.push).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'login' }),
    );
    expect(mocks.refreshTokens).toHaveBeenCalledOnce();
  });

  it('keeps retrying when an auth page resets the form state', async () => {
    mocks.refreshTokens.mockRejectedValue(httpError(503));
    const store = useAuthStore();

    await store.init();
    store.reset();
    await vi.advanceTimersByTimeAsync(5_000);

    expect(mocks.refreshTokens).toHaveBeenCalledTimes(2);
  });

  it('stops retrying on logout', async () => {
    mocks.refreshTokens.mockRejectedValue(httpError(503));
    const store = useAuthStore();

    await store.init();
    mocks.bus?.emit('logout');
    await vi.advanceTimersByTimeAsync(60_000);

    expect(mocks.refreshTokens).toHaveBeenCalledOnce();
    expect(store.status).toBe('unauthenticated');
  });

  it('loads the profile on a successful refresh regardless of caller', async () => {
    mocks.refreshTokens.mockResolvedValue({});
    const store = useAuthStore();

    // Bypasses init() entirely, mimicking a proactive/background refresh
    // succeeding — the profile must still get loaded, not depend on init().
    await store.refreshTokens();

    expect(mocks.fetchProfile).toHaveBeenCalledOnce();
  });
});

describe('auth store logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.bus = new EventBus();
    setActivePinia(createPinia());
  });

  it('redirects home once the API confirms the logout', async () => {
    mocks.logout.mockResolvedValue(undefined);
    const store = useAuthStore();

    await store.logout();

    expect(mocks.push).toHaveBeenCalledWith('/');
  });

  it('does not redirect when the logout request fails', async () => {
    mocks.logout.mockRejectedValue(httpError(500));
    const store = useAuthStore();

    await store.logout();

    expect(mocks.push).not.toHaveBeenCalled();
  });
});
