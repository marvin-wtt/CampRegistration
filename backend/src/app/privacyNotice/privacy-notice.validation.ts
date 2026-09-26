import { z, type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import {
  LEGAL_BASIS_KEYS,
  PRIVACY_DATA_CATEGORY_KEYS,
  PRIVACY_PURPOSE_KEYS,
  PRIVACY_RECIPIENT_KEYS,
  RETENTION_ANCHORS,
  SPECIAL_CATEGORY_BASIS_KEYS,
  TRANSFER_SAFEGUARDS,
  type EventPrivacyNoticeUpdateData,
  type CustomKey,
  type PrivacyNoticeAddendum,
  type PrivacyNoticeContent,
  type PrivacyNoticeUpdateData,
} from '@camp-registration/common/privacy';

const TranslatableSchema = translatedValue(z.string());

/**
 * A catalogue key or a `custom:<id>` reference. The id is bounded and kept to
 * safe characters because it ends up as a rendering key on the public page.
 */
const customRef = /^custom:[A-Za-z0-9_-]{1,64}$/;

const CustomKeySchema = z.custom<CustomKey>(
  (value) => typeof value === 'string' && customRef.test(value),
  { message: 'Invalid custom key' },
);

const refSchema = <T extends readonly [string, ...string[]]>(keys: T) =>
  z.union([z.enum(keys), CustomKeySchema]);

const PurposeSchema = z.object({
  key: refSchema(PRIVACY_PURPOSE_KEYS),
  legalBasis: z.enum(LEGAL_BASIS_KEYS),
  legitimateInterest: TranslatableSchema.nullish(),
  label: TranslatableSchema.nullish(),
});

const DataCategorySchema = z.object({
  key: refSchema(PRIVACY_DATA_CATEGORY_KEYS),
  specialCategoryBasis: z.enum(SPECIAL_CATEGORY_BASIS_KEYS).nullish(),
  label: TranslatableSchema.nullish(),
  special: z.boolean().optional(),
});

const RecipientSchema = z.object({
  key: z.enum(PRIVACY_RECIPIENT_KEYS),
  name: z.string().max(255).nullish(),
  country: z.string().length(2).nullish(),
});

const RetentionExceptionBase = {
  scope: refSchema(PRIVACY_PURPOSE_KEYS),
  label: TranslatableSchema.nullish(),
  reason: TranslatableSchema.nullish(),
};

const RetentionPeriodExceptionSchema = z.object({
  ...RetentionExceptionBase,
  // Absent on everything published before consent-bound exceptions existed, so
  // it cannot be required — see `PrivacyRetentionPeriodException`.
  until: z.literal('period').optional(),
  // Statutory retention is what exceptions exist for, and tax law reaches ten
  // years — so the ceiling here is higher than the baseline's.
  months: z.int().min(1).max(600),
  anchor: z.enum(RETENTION_ANCHORS),
});

/**
 * No period, by design. `months`/`anchor` are refused rather than ignored: a
 * stored number nothing reads is a number the next author will believe.
 */
const RetentionConsentExceptionSchema = z.strictObject({
  ...RetentionExceptionBase,
  until: z.literal('consent_withdrawn'),
});

// Consent first: the period branch accepts a missing `until`, so it would
// otherwise swallow the consent-bound shape and report a missing `months`.
const RetentionExceptionSchema = z.union([
  RetentionConsentExceptionSchema,
  RetentionPeriodExceptionSchema,
]);

const RetentionSchema = z.object({
  // A event that keeps every registration for a decade has a storage-limitation
  // problem, not a configuration need; anything longer belongs in an exception.
  months: z.int().min(1).max(240),
  anchor: z.enum(RETENTION_ANCHORS),
  exceptions: z.array(RetentionExceptionSchema).max(25),
});

const ThirdCountryTransfersSchema = z.object({
  enabled: z.boolean(),
  countries: z.array(z.string().length(2)).max(50),
  safeguard: z.enum(TRANSFER_SAFEGUARDS).nullish(),
  note: TranslatableSchema.nullish(),
});

const DpoSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.email().max(255),
});

// Catalogue length plus headroom for custom entries, rather than an exact
// count: the arrays now carry `custom:` refs the catalogue knows nothing about.
const MAX_CUSTOM_ENTRIES = 25;

const ContentSchema = z.object({
  mode: z.enum(['builder', 'free_text']),
  purposes: z
    .array(PurposeSchema)
    .max(PRIVACY_PURPOSE_KEYS.length + MAX_CUSTOM_ENTRIES),
  dataCategories: z
    .array(DataCategorySchema)
    .max(PRIVACY_DATA_CATEGORY_KEYS.length + MAX_CUSTOM_ENTRIES),
  recipients: z.array(RecipientSchema).max(PRIVACY_RECIPIENT_KEYS.length),
  retention: RetentionSchema.nullable(),
  thirdCountryTransfers: ThirdCountryTransfersSchema,
  dpo: DpoSchema.nullable(),
  automatedDecisionMaking: z.boolean(),
  automatedDecisionMakingDetails: TranslatableSchema.nullable(),
  additional: TranslatableSchema.nullable(),
  freeText: TranslatableSchema.nullable(),
}) satisfies ZodType<PrivacyNoticeContent>;

/** The event addendum states only what differs, so every field is optional. */
const AddendumSchema = z.object({
  purposes: z
    .array(PurposeSchema)
    .max(PRIVACY_PURPOSE_KEYS.length + MAX_CUSTOM_ENTRIES)
    .optional(),
  dataCategories: z
    .array(DataCategorySchema)
    .max(PRIVACY_DATA_CATEGORY_KEYS.length + MAX_CUSTOM_ENTRIES)
    .optional(),
  recipients: z
    .array(RecipientSchema)
    .max(PRIVACY_RECIPIENT_KEYS.length)
    .optional(),
  retention: RetentionSchema.nullish(),
  thirdCountryTransfers: ThirdCountryTransfersSchema.nullish(),
  additional: TranslatableSchema.nullish(),
}) satisfies ZodType<PrivacyNoticeAddendum>;

const updateOrganization = z.object({
  body: z.object({
    content: ContentSchema,
  }) satisfies ZodType<PrivacyNoticeUpdateData>,
});

const updateAddendum = z.object({
  body: z.object({
    content: AddendumSchema,
  }) satisfies ZodType<EventPrivacyNoticeUpdateData>,
});

export default {
  updateOrganization,
  updateAddendum,
};
