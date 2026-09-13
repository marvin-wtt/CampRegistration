export interface TranslationStatus {
  available: boolean;
}

export interface TranslationResult {
  translations: Record<string, string | null>;
}
