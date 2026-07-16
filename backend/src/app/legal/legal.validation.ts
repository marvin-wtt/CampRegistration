import { z } from 'zod';
import { translatedValue } from '#core/validation/helper';

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
  }),
});

export default {
  show,
  update,
};
