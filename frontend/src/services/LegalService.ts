import { api } from '@/services/api';
import type {
  LegalDocument,
  LegalDocumentType,
  Translatable,
} from '@camp-registration/common/entities';

export function useLegalService() {
  async function fetchLegalDocuments(): Promise<LegalDocument[]> {
    const response = await api.get('legal/');

    return response?.data?.data;
  }

  async function fetchLegalDocument(
    type: LegalDocumentType,
  ): Promise<LegalDocument> {
    const response = await api.get(`legal/${type}/`);

    return response?.data?.data;
  }

  async function updateLegalDocument(
    type: LegalDocumentType,
    content: Translatable | null,
  ): Promise<LegalDocument> {
    const response = await api.patch(`legal/${type}/`, { content });

    return response?.data?.data;
  }

  return {
    fetchLegalDocuments,
    fetchLegalDocument,
    updateLegalDocument,
  };
}
