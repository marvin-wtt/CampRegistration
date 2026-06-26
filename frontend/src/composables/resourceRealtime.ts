import { onMounted, onUnmounted } from 'vue';
import type { RealtimeResource } from '@camp-registration/common/realtime';
import { useRealtimeStore } from 'stores/realtime-store';

/**
 * Opens a page-scoped realtime stream for `resource` while the calling
 * component is mounted, closing it on unmount. Events dispatch through the
 * realtime store's registry, so the resource's store reacts via its own
 * `realtime.on(resource, ...)` subscription.
 */
export function useResourceRealtime(resource: RealtimeResource) {
  const realtime = useRealtimeStore();
  let close: (() => void) | undefined;

  onMounted(() => {
    close = realtime.openResourceStream(resource);
  });

  onUnmounted(() => {
    close?.();
  });
}
