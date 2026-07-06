import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { watch } from 'vue';
import type {
  RealtimeEvent,
  RealtimeResource,
} from '@camp-registration/common/realtime';
import { useRealtimeService } from '@/services/RealtimeService';
import { useAuthBus } from '@/composables/bus';
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

  function openStream(campId: string) {
    closeStream();

    source = openCampStream(campId);

    source.onopen = () => {
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
  }

  function closeStream() {
    source?.close();
    source = undefined;
    hasConnected = false;
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

    authBus.on('logout', closeStream);
  }

  return {
    on,
    onReconnect,
    connect,
  };
});
