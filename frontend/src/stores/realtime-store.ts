import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { onScopeDispose, watch } from 'vue';
import type {
  RealtimeEvent,
  RealtimeResource,
} from '@camp-registration/common/realtime';
import { useRealtimeService } from '@/services/RealtimeService';
import { useAuthBus } from '@/composables/bus';
import { useAuthStore } from '@/stores/auth-store';
import { clientId } from '@/services/clientId';

type EventHandler = (event: RealtimeEvent) => void;
type ReconnectHandler = () => void;

/**
 * Owns the live SSE stream for the active camp and acts as a registry: feature
 * stores subscribe to the resources they care about via `on(resource, handler)`.
 * The realtime layer never imports feature stores, so adding a reactive resource
 * only touches that resource's own store (mirrors the existing
 * `authBus.on(...)`/`campBus.on(...)` self-subscription idiom).
 *
 * `connect()` opens the single camp stream (all resources; the server filters
 * events by permission) and is called once from the camp management layout.
 */
export const useRealtimeStore = defineStore('realtime', () => {
  const route = useRoute();
  const authBus = useAuthBus();
  const { openCampStream } = useRealtimeService();

  const handlers = new Map<RealtimeResource, Set<EventHandler>>();
  const reconnectHandlers = new Map<RealtimeResource, Set<ReconnectHandler>>();

  let source: EventSource | undefined;
  // Distinguishes the first connect from later reconnects (to catch up on
  // events missed while disconnected).
  let hasConnected = false;
  let started = false;

  // The camp whose stream should currently be open (`undefined` when closed).
  // Manual reconnects re-open this camp; a camp switch that lands here mid-flight
  // is detected by comparing against it.
  let currentCampId: string | undefined;
  // Manual-reconnect backoff. Native EventSource recovers transport drops on its
  // own; these only drive the CLOSED (permanent) recovery path — see onerror.
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let reconnectAttempts = 0;
  const BASE_RECONNECT_DELAY_MS = 1_000;
  const MAX_RECONNECT_DELAY_MS = 30_000;

  /** Subscribe to events for a resource. Returns an unsubscribe function. */
  function on(resource: RealtimeResource, handler: EventHandler): () => void {
    const set = handlers.get(resource) ?? new Set<EventHandler>();
    set.add(handler);
    handlers.set(resource, set);

    return () => set.delete(handler);
  }

  /**
   * Run a handler when the stream reconnects (to recover events missed while
   * disconnected). Returns an unsubscribe function.
   */
  function onReconnect(
    resource: RealtimeResource,
    handler: ReconnectHandler,
  ): () => void {
    const set = reconnectHandlers.get(resource) ?? new Set<ReconnectHandler>();
    set.add(handler);
    reconnectHandlers.set(resource, set);

    return () => set.delete(handler);
  }

  function dispatch(event: RealtimeEvent) {
    // Skip the echo of our own writes — we already have the authoritative state
    // from the mutation response, so refetching would be redundant.
    if (event.origin === clientId) {
      return;
    }
    handlers.get(event.resource)?.forEach((handler) => handler(event));
  }

  function fireReconnect() {
    for (const set of reconnectHandlers.values()) {
      set.forEach((handler) => handler());
    }
  }

  /** Create the EventSource for `campId` and wire its handlers. */
  function createSource(campId: string) {
    source = openCampStream(campId);

    source.onopen = () => {
      reconnectAttempts = 0;
      if (hasConnected) {
        fireReconnect();
      }
      hasConnected = true;
    };

    source.onmessage = (e: MessageEvent<string>) => {
      try {
        dispatch(JSON.parse(e.data) as RealtimeEvent);
      } catch {
        // Ignore malformed frames (comments/heartbeats are not delivered here).
      }
    };

    source.onerror = () => {
      // While readyState is CONNECTING (0), native EventSource is already
      // retrying the transport-level drop on its own — leave it alone. It only
      // lands in CLOSED (2) when a reconnect attempt got an HTTP error response
      // and it has permanently given up. The overwhelmingly common cause is an
      // expired auth cookie (the connect guard returns 401), which native
      // reconnect can never recover from — so drive our own re-auth + backoff.
      if (source?.readyState === EventSource.CLOSED) {
        scheduleReconnect();
      }
    };
  }

  function openStream(campId: string) {
    closeStream();
    currentCampId = campId;
    createSource(campId);
  }

  function closeStream() {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
    reconnectAttempts = 0;
    currentCampId = undefined;
    source?.close();
    source = undefined;
    hasConnected = false;
  }

  function scheduleReconnect() {
    if (reconnectTimer !== undefined || currentCampId === undefined) {
      return;
    }
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * 2 ** reconnectAttempts,
      MAX_RECONNECT_DELAY_MS,
    );
    reconnectAttempts++;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined;
      void reconnect();
    }, delay);
  }

  async function reconnect() {
    const campId = currentCampId;
    if (campId === undefined) {
      return;
    }
    // A permanent close is almost always an expired access-token cookie. Renew
    // it through the same refresh path axios uses before reopening; otherwise
    // the connect guard rejects us again and EventSource gives up for good.
    // (If the session is truly gone, the API layer redirects to login.)
    await useAuthStore().refreshTokens();
    // A camp switch or close may have happened while the refresh was in flight.
    if (currentCampId !== campId) {
      return;
    }
    source?.close();
    createSource(campId);
  }

  /**
   * A backgrounded/asleep tab has its stream socket suspended by the browser
   * and its refresh timer throttled, so it typically resumes with a dead
   * (CLOSED) stream and a stale cookie. Recover eagerly on resume instead of
   * waiting out the backoff.
   */
  function handleResume() {
    if (
      currentCampId !== undefined &&
      source?.readyState === EventSource.CLOSED
    ) {
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
      reconnectAttempts = 0;
      void reconnect();
    }
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      handleResume();
    }
  }

  const activeCampId = (): string | undefined => {
    const value = route.params.campId;
    return Array.isArray(value) ? value[0] : value;
  };

  /** Open and maintain the stream for the active camp. Idempotent. */
  function connect() {
    if (started) {
      return;
    }
    started = true;

    watch(
      () => route.params.campId,
      () => {
        const campId = activeCampId();
        if (campId) {
          openStream(campId);
        } else {
          closeStream();
        }
      },
      { immediate: true },
    );

    // Recover a stream that died while the tab was backgrounded/asleep as soon
    // as it comes back to the foreground or the network returns.
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', handleResume);

    authBus.on('logout', closeStream);
  }

  // The store is an app-lifetime singleton, but under HMR/tests/`$dispose()` it
  // can be torn down — drop the global listeners with it so they don't leak
  // onto a dead store instance. Registered at setup scope (the only place with
  // an active effect scope); safe whether or not `connect()` added them.
  onScopeDispose(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('online', handleResume);
    closeStream();
  });

  return {
    on,
    onReconnect,
    connect,
  };
});
