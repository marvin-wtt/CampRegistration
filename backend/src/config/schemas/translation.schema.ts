import { z } from 'zod';

export const TranslationEnvSchema = z
  .object({
    TRANSLATION_DRIVER: z
      .enum(['azure', 'deepl', 'google'])
      .readonly()
      .optional()
      .describe(
        'The machine-translation provider used to auto-translate input ' +
          'fields. Unset (default) hides the auto-translate feature in the ' +
          'UI entirely.',
      ),

    AZURE_TRANSLATOR_KEY: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe('Azure Translator resource key'),
    AZURE_TRANSLATOR_REGION: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe('Azure Translator resource region (e.g. "westeurope")'),
    AZURE_TRANSLATOR_ENDPOINT: z
      .url()
      .default('https://api.cognitive.microsofttranslator.com')
      .describe('Azure Translator API endpoint'),

    DEEPL_API_KEY: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe('DeepL API authentication key'),
    DEEPL_API_URL: z
      .url()
      .optional()
      .describe(
        'DeepL API base URL. Defaults to the free or pro endpoint based on ' +
          'the API key suffix (free keys end with ":fx").',
      ),

    GOOGLE_TRANSLATE_API_KEY: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe('Google Cloud Translation API key'),
  })
  .superRefine((data, ctx) => {
    if (data.TRANSLATION_DRIVER === 'azure' && !data.AZURE_TRANSLATOR_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['AZURE_TRANSLATOR_KEY'],
        message: 'Required when TRANSLATION_DRIVER is "azure".',
      });
    }

    if (data.TRANSLATION_DRIVER === 'azure' && !data.AZURE_TRANSLATOR_REGION) {
      ctx.addIssue({
        code: 'custom',
        path: ['AZURE_TRANSLATOR_REGION'],
        message: 'Required when TRANSLATION_DRIVER is "azure".',
      });
    }

    if (data.TRANSLATION_DRIVER === 'deepl' && !data.DEEPL_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['DEEPL_API_KEY'],
        message: 'Required when TRANSLATION_DRIVER is "deepl".',
      });
    }

    if (
      data.TRANSLATION_DRIVER === 'google' &&
      !data.GOOGLE_TRANSLATE_API_KEY
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['GOOGLE_TRANSLATE_API_KEY'],
        message: 'Required when TRANSLATION_DRIVER is "google".',
      });
    }
  });

export type TranslationEnv = z.output<typeof TranslationEnvSchema>;
