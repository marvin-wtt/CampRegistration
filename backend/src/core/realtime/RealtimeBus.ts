import type { RealtimeEvent } from '@camp-registration/common/realtime';

export type RealtimeListener = (event: RealtimeEvent) => void;

/**
 * Fan-out backplane for realtime events, scoped per event. Implementations
 * deliver events published on one process to every subscriber, possibly across
 * processes (see {@link RedisRealtimeBus}).
 */
export interface RealtimeBus {
  readonly type: string;

  publish(eventId: string, event: RealtimeEvent): Promise<void> | void;

  /** Subscribe to a event's events. Returns an unsubscribe function. */
  subscribe(eventId: string, listener: RealtimeListener): () => void;

  close(): Promise<void> | void;
}
