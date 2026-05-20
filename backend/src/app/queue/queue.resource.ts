import type { QueueInfo } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class QueueResource extends JsonResource<QueueInfo, QueueInfo> {
  transform(): QueueInfo {
    return {
      name: this.data.name,
      counts: {
        active: this.data.counts.active,
        failed: this.data.counts.failed,
        pending: this.data.counts.pending,
        delayed: this.data.counts.delayed,
      },
    };
  }
}
