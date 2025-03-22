import type { TableTemplate } from '@prisma/client';
import type { TableTemplate as TableTemplateData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class TableTemplateResource extends JsonResource<
  TableTemplate,
  TableTemplateData
> {
  transform(): TableTemplateData {
    const data = typeof this.data.data as unknown as TableTemplateData;

    return {
      ...data,
      id: this.data.id,
    };
  }
}
