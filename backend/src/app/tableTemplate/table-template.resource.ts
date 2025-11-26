import type { TableTemplate } from '#/generated/prisma/client.js';
import type { TableTemplate as TableTemplateData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class TableTemplateResource extends JsonResource<
  TableTemplate,
  TableTemplateData
> {
  transform(): TableTemplateData {
    const data = this.data.data as unknown as TableTemplateData;

    return {
      ...data,
      id: this.data.id,
    };
  }
}
