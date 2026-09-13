import type { ProgramPublicView } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { ProgramItemResource } from '#app/programItem/program-item.resource';
import type { ProgramPublicViewData } from './program-public.service.js';

export class ProgramPublicResource extends JsonResource<
  ProgramPublicViewData,
  ProgramPublicView
> {
  transform(): ProgramPublicView {
    if (!this.data.enabled) {
      return { enabled: false };
    }

    if (!this.data.published) {
      return {
        enabled: true,
        date: this.data.date,
        minDate: this.data.minDate,
        maxDate: this.data.maxDate,
        published: false,
      };
    }

    return {
      enabled: true,
      date: this.data.date,
      minDate: this.data.minDate,
      maxDate: this.data.maxDate,
      published: true,
      plan: this.data.plan,
      items: ProgramItemResource.collection(this.data.items).transform(),
    };
  }
}
