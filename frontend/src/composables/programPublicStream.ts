import { onScopeDispose } from 'vue';
import { useRealtimeService } from '@/services/RealtimeService';

/**
 * Opens the anonymous public-program SSE stream for one event and calls
 * `onChange` on every message. Every event this stream can possibly deliver
 * (`program_item`, `setting`) means "refetch the public program view", so
 * unlike `realtime-store.ts` (built for the authenticated management layout)
 * there's no per-resource dispatch registry here — just one callback.
 */
export function useProgramPublicStream(
  eventId: string,
  onChange: () => void,
): void {
  const { openPublicProgramStream } = useRealtimeService();

  const source = openPublicProgramStream(eventId);

  source.onmessage = (e: MessageEvent<string>) => {
    try {
      // The parsed value itself is unused — every event this stream can
      // deliver means "refetch" (see above), so this is purely a validity
      // check that rejects malformed frames via the catch below.
      JSON.parse(e.data);
      onChange();
    } catch {
      // Ignore malformed frames (comments/heartbeats aren't delivered here).
    }
  };

  onScopeDispose(() => {
    source.close();
  });
}
