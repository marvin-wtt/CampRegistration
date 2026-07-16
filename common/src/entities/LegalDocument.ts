import type { Translatable } from './Translatable.js';

export type LegalDocumentType = 'IMPRINT' | 'PRIVACY_POLICY';

export interface LegalDocument {
  type: LegalDocumentType;
  content: Translatable | null;
  updatedAt: string | null;
}

export type LegalDocumentUpdateData = Pick<LegalDocument, 'content'>;
