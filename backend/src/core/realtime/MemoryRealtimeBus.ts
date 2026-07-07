import { EventEmitter } from 'node:events';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import type { RealtimeBus, RealtimeListener } from '#core/realtime/RealtimeBus';

/**
 * In-process realtime bus. Suitable for single-instance deployments and dev.
 * Does not fan out across processes — use {@link RedisRealtimeBus} for that.
 */
export class MemoryRealtimeBus implements RealtimeBus {
  public readonly type = 'memory';

  private readonly emitter = new EventEmitter();

  constructor() {
    // Camps with many concurrent subscribers are normal; lift the warning cap.
    this.emitter.setMaxListeners(0);
  }

  publish(campId: string, event: RealtimeEvent): void {
    this.emitter.emit(campId, event);
  }

  subscribe(campId: string, listener: RealtimeListener): () => void {
    this.emitter.on(campId, listener);
    return () => this.emitter.off(campId, listener);
  }

  close(): void {
    this.emitter.removeAllListeners();
  }
}
