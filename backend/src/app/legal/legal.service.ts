import { Prisma } from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import type { LegalDocumentType } from '@camp-registration/common/entities';
import { sanitizeHtmlContent } from '#utils/sanitize';

type NullableTranslation = string | Record<string, string> | null;

const ALL_TYPES: LegalDocumentType[] = ['IMPRINT', 'PRIVACY_POLICY'];

function placeholder(type: LegalDocumentType) {
  return { id: '', type, content: null, updatedAt: null };
}

@injectable()
export class LegalService extends BaseService {
  async getDocument(type: LegalDocumentType) {
    const document = await this.prisma.legalDocument.findUnique({
      where: { type },
    });

    return document ?? placeholder(type);
  }

  async getAllDocuments() {
    const documents = await this.prisma.legalDocument.findMany();

    return ALL_TYPES.map(
      (type) =>
        documents.find((document) => document.type === type) ??
        placeholder(type),
    );
  }

  async upsertDocument(type: LegalDocumentType, content: NullableTranslation) {
    const jsonContent = this.sanitizeContent(content) ?? Prisma.JsonNull;

    return this.prisma.legalDocument.upsert({
      where: { type },
      create: {
        type,
        content: jsonContent,
      },
      update: { content: jsonContent },
    });
  }

  private sanitizeContent(content: NullableTranslation) {
    if (content === null) {
      return content;
    }

    if (typeof content === 'string') {
      return sanitizeHtmlContent(content);
    }

    if (typeof content === 'object') {
      const clean: Record<string, string> = {};
      for (const key in content) {
        clean[key] = sanitizeHtmlContent(content[key]);
      }
      return clean;
    }
  }

  async getOverviewCounts() {
    const documents = await this.getAllDocuments();
    const configured = documents.filter(
      (document) => document.content !== null,
    ).length;

    return { total: ALL_TYPES.length, configured };
  }
}
