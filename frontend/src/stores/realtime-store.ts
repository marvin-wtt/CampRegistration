import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { watch } from 'vue';
import type {
  RealtimeEvent,
  RealtimeResource,
} from '@camp-registration/common/realtime';
import { useRealtimeService } from 'src/services/RealtimeService';
import { useAuthBus } from 'src/composables/bus';
import { clientId } from 'src/services/clientId';

type EventHandler = (event: RealtimeEvent) => void;
type ReconnectHandler = () => void;

interface StreamState {
  source: EventSource;
  resources: RealtimeResource[];
  // Distinguishes the first connect from later reconnects (to catch up on
  // events missed while disconnected).
  hasConnected: boolean;
}

const AMBIENT_KEY = 'ambient';
const resourceKey = (resource: RealtimeResource) => `resource:${resource}`;

/**
 * Owns the live SSE streams for the active camp and acts as a registry: feature
 * stores subscribe to the resources they care about via `on(resource, handler)`.
 * The realtime layer never imports feature stores, so adding a reactive resource
 * only touches that resource's own store (mirrors the existing
 * `authBus.on(...)`/`campBus.on(...)` self-subscription idiom).
 *
 * - `connect()` opens the always-on ambient stream (camp + registration) and is
 *   called once from the camp management layout.
 * - `openResourceStream(resource)` opens a page-scoped stream and returns a
 *   cleanup function for the calling component's lifecycle.
 */
export const useRealtimeStore = defineStore('realtime', () => {
  const route = useRoute();
  const authBus = useAuthBus();
  const { openCampStream, openResourceStream: openResourceSource } =
    useRealtimeService();

  const handlers = new Map<RealtimeResource, Set<EventHandler>>();
  const reconnectHandlers = new Map<RealtimeResource, Set<ReconnectHandler>>();
  const streams = new Map<string, StreamState>();

  let ambientStarted = false;

  /** Subscribe to events for a resource. Returns an unsubscribe function. */
  function on(resource: RealtimeResource, handler: EventHandler): () => void {
    const set = handlers.get(resource) ?? new Set<EventHandler>();
    set.add(handler);
    handlers.set(resource, set);

    return () => set.delete(handler);
  }

  /**
   * Run a handler when a stream carrying `resource` reconnects (to recover
   * events missed while disconnected). Returns an unsubscribe function.
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

  function fireReconnect(resources: RealtimeResource[]) {
    for (const resource of resources) {
      reconnectHandlers.get(resource)?.forEach((handler) => handler());
    }
  }

  function openStream(
    key: string,
    source: EventSource,
    resources: RealtimeResource[],
  ) {
    closeStream(key);

    const state: StreamState = { source, resources, hasConnected: false };

    source.onopen = () => {
      if (state.hasConnected) {
        fireReconnect(resources);
      }
      state.hasConnected = true;
    };

    source.onmessage = (e: MessageEvent<string>) => {
      try {
        dispatch(JSON.parse(e.data) as RealtimeEvent);
      } catch {
        // Ignore malformed frames (comments/heartbeats are not delivered here).
      }
    };

    streams.set(key, state);
  }

  function closeStream(key: string) {
    const state = streams.get(key);
    if (state) {
      state.source.close();
      streams.delete(key);
    }
  }

  function closeAll() {
    for (const key of [...streams.keys()]) {
      closeStream(key);
    }
  }

  const activeCampId = (): string | undefined => {
    const value = route.params.campId;
    return Array.isArray(value) ? value[0] : value;
  };

  /** Open and maintain the ambient stream for the active camp. Idempotent. */
  function connect() {
    if (ambientStarted) {
      return;
    }
    ambientStarted = true;

    watch(
      () => route.params.campId,
      () => {
        const campId = activeCampId();
        if (campId) {
          openStream(AMBIENT_KEY, openCampStream(campId), [
            'camp',
            'registration',
          ]);
        } else {
          closeStream(AMBIENT_KEY);
        }
      },
      { immediate: true },
    );

    authBus.on('logout', closeAll);
  }

  /**
   * Open a page-scoped stream for a single resource. Returns a cleanup function
   * to close it (call from the consuming component's `onUnmounted`).
   */
  function openResourceStream(resource: RealtimeResource): () => void {
    const campId = activeCampId();
    const key = resourceKey(resource);

    if (campId) {
      openStream(key, openResourceSource(campId, resource), [resource]);
    }

    return () => closeStream(key);
  }

  return {
    on,
    onReconnect,
    connect,
    openResourceStream,
  };
});
