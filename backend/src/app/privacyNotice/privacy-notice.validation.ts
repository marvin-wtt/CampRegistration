import { z, type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import {
  DATA_PROTECTION_FRAMEWORKS,
  LEGAL_BASIS_KEYS,
  PRIVACY_DATA_CATEGORY_KEYS,
  PRIVACY_PURPOSE_KEYS,
  PRIVACY_RECIPIENT_KEYS,
  SPECIAL_CATEGORY_BASIS_KEYS,
  TRANSFER_SAFEGUARDS,
  isEventCustomKey,
  type EventPrivacyNoticeUpdateData,
  type CustomKey,
  type PrivacyNoticeAddendum,
  type PrivacyNoticeContent,
  type PrivacyNoticeExclusions,
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
  // Null until chosen; the completeness check refuses publishing without it.
  legalBasis: z.enum(LEGAL_BASIS_KEYS).nullable(),
  legitimateInterest: TranslatableSchema.nullish(),
  label: TranslatableSchema.nullish(),
  allEvents: z.boolean().nullish(),
});

const DataCategorySchema = z.object({
  key: refSchema(PRIVACY_DATA_CATEGORY_KEYS),
  specialCategoryBasis: z.enum(SPECIAL_CATEGORY_BASIS_KEYS).nullish(),
  legalReference: TranslatableSchema.nullish(),
  label: TranslatableSchema.nullish(),
  special: z.boolean().optional(),
  allEvents: z.boolean().nullish(),
});

const RecipientSchema = z.object({
  key: refSchema(PRIVACY_RECIPIENT_KEYS),
  label: TranslatableSchema.nullish(),
  name: z.string().max(255).nullish(),
  country: z.string().length(2).toLowerCase().nullish(),
  allEvents: z.boolean().nullish(),
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
});

/** Ends with the withdrawal, and at the latest after `months`. */
const RetentionConsentExceptionSchema = z.object({
  ...RetentionExceptionBase,
  until: z.literal('consent_withdrawn'),
  months: z.int().min(1).max(600).optional(),
});

// Consent first: the period branch accepts a missing `until`, so it would
// otherwise swallow the consent-bound shape and report a missing `months`.
const RetentionExceptionSchema = z.union([
  RetentionConsentExceptionSchema,
  RetentionPeriodExceptionSchema,
]);

// Every period counts from the event end. Content from versions that still
// carry an `anchor` is stripped of it, as of any key nothing reads, so it is
// never stored again.
const RetentionSchema = z.object({
  // A event that keeps every registration for a decade has a storage-limitation
  // problem, not a configuration need; anything longer belongs in an exception.
  months: z.int().min(1).max(240),
  exceptions: z.array(RetentionExceptionSchema).max(25),
  specialCategories: z
    .object({
      weeks: z.int().min(1).max(960),
    })
    .nullish(),
});

const ThirdCountryTransfersSchema = z.object({
  enabled: z.boolean(),
  countries: z.array(z.string().length(2).toLowerCase()).max(50),
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

const ContentSchema = z
  .object({
    framework: z.enum(DATA_PROTECTION_FRAMEWORKS).nullish(),
    // Stamped by the server on publish; whatever the client sends is replaced.
    frameworkVersion: z.string().max(64).nullish(),
    supervisoryAuthority: z
      .object({
        name: z.string().max(255),
        // Rendered as a link on the public notice: http(s) only, like
        // `Organization.website`.
        website: z
          .url({ protocol: /^https?$/, hostname: z.regexes.domain })
          .max(255)
          .nullish(),
      })
      .nullish(),
    mode: z.enum(['builder', 'free_text']),
    purposes: z
      .array(PurposeSchema)
      .max(PRIVACY_PURPOSE_KEYS.length + MAX_CUSTOM_ENTRIES),
    dataCategories: z
      .array(DataCategorySchema)
      .max(PRIVACY_DATA_CATEGORY_KEYS.length + MAX_CUSTOM_ENTRIES),
    recipients: z
      .array(RecipientSchema)
      .max(PRIVACY_RECIPIENT_KEYS.length + MAX_CUSTOM_ENTRIES),
    retention: RetentionSchema.nullable(),
    thirdCountryTransfers: ThirdCountryTransfersSchema,
    dpo: DpoSchema.nullable(),
    automatedDecisionMaking: z.boolean(),
    automatedDecisionMakingDetails: TranslatableSchema.nullable(),
    additional: TranslatableSchema.nullable(),
    freeText: TranslatableSchema.nullable(),
  })
  // Event entries have a key range of their own so that composition, which
  // merges by key, can never let one replace an organization entry.
  .refine((content) => !organizationKeys(content).some(isEventCustomKey), {
    message: 'Organization entries cannot use an event key',
  }) satisfies ZodType<PrivacyNoticeContent>;

function organizationKeys(content: {
  purposes: { key: string }[];
  dataCategories: { key: string }[];
  recipients: { key: string }[];
  retention: { exceptions: { scope: string }[] } | null;
}): string[] {
  return [
    ...content.purposes.map((entry) => entry.key),
    ...content.dataCategories.map((entry) => entry.key),
    ...content.recipients.map((entry) => entry.key),
    ...(content.retention?.exceptions.map((exception) => exception.scope) ??
      []),
  ];
}

const ExclusionsSchema = z.object({
  purposes: z
    .array(refSchema(PRIVACY_PURPOSE_KEYS))
    .max(PRIVACY_PURPOSE_KEYS.length + MAX_CUSTOM_ENTRIES)
    .optional(),
  dataCategories: z
    .array(refSchema(PRIVACY_DATA_CATEGORY_KEYS))
    .max(PRIVACY_DATA_CATEGORY_KEYS.length + MAX_CUSTOM_ENTRIES)
    .optional(),
  recipients: z
    .array(refSchema(PRIVACY_RECIPIENT_KEYS))
    .max(PRIVACY_RECIPIENT_KEYS.length + MAX_CUSTOM_ENTRIES)
    .optional(),
  transferCountries: z
    .array(z.string().length(2).toLowerCase())
    .max(50)
    .optional(),
}) satisfies ZodType<PrivacyNoticeExclusions>;

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
    .max(PRIVACY_RECIPIENT_KEYS.length + MAX_CUSTOM_ENTRIES)
    .optional(),
  retention: RetentionSchema.nullish(),
  thirdCountryTransfers: ThirdCountryTransfersSchema.nullish(),
  additional: TranslatableSchema.nullish(),
  excluded: ExclusionsSchema.nullish(),
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
