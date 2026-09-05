import { api } from '@/services/api';
import type {
  TranslationResult,
  TranslationStatus,
} from '@camp-registration/common/entities';

export function useTranslationService() {
  async function fetchTranslationStatus(): Promise<TranslationStatus> {
    const response = await api.get('translation/status');
    return response?.data?.data;
  }

  async function translateText(
    text: string,
    targetLocale: string,
    sourceLocale?: string,
  ): Promise<string> {
    const response = await api.post('translation', {
      text,
      targetLocale,
      sourceLocale,
    });
    const result: TranslationResult | undefined = response?.data?.data;

    return result?.text ?? text;
  }

  return { fetchTranslationStatus, translateText };
}
