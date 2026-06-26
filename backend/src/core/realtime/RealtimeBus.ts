import type { RealtimeEvent } from '@camp-registration/common/realtime';

export type RealtimeListener = (event: RealtimeEvent) => void;

/**
 * Fan-out backplane for realtime events, scoped per camp. Implementations
 * deliver events published on one process to every subscriber, possibly across
 * processes (see {@link RedisRealtimeBus}).
 */
export interface RealtimeBus {
  readonly type: string;

  publish(campId: string, event: RealtimeEvent): Promise<void> | void;

  /** Subscribe to a camp's events. Returns an unsubscribe function. */
  subscribe(campId: string, listener: RealtimeListener): () => void;

  close(): Promise<void> | void;
}
