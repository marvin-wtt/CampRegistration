import type { LegalDocument as PrismaLegalDocument } from '#generated/prisma/client.js';
import type { LegalDocument as LegalDocumentResourceData } from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class LegalDocumentResource extends JsonResource<
  PrismaLegalDocument,
  LegalDocumentResourceData
> {
  transform(): LegalDocumentResourceData {
    return {
      type: this.data.type,
      content: this.data.content,
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
    };
  }
}
