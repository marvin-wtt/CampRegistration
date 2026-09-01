import { z, type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import type { LegalDocumentUpdateData } from '@camp-registration/common/entities';

const LegalDocumentTypeSchema = z.enum(['IMPRINT', 'PRIVACY_POLICY']);

const show = z.object({
  params: z.object({
    type: LegalDocumentTypeSchema,
  }),
});

const update = z.object({
  params: z.object({
    type: LegalDocumentTypeSchema,
  }),
  body: z.object({
    content: translatedValue(z.string()).nullable(),
  }) satisfies ZodType<LegalDocumentUpdateData>,
});

export default {
  show,
  update,
};
