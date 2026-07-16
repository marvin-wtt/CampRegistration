import type { AdminOverview } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class AdminOverviewResource extends JsonResource<
  AdminOverview,
  AdminOverview
> {
  transform(): AdminOverview {
    return this.data;
  }
}
