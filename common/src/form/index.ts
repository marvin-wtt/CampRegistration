import { registerFormExtensions } from './register.js';
import { setVariables, VARIABLE_NAMES } from './variables/index.js';

// On import, so nothing that reads a form can run without them.
registerFormExtensions();

export { registerFormExtensions };
export { setVariables, VARIABLE_NAMES };
export { formLintOptions } from './lint.js';
export { extractEventData } from './eventData.js';
export {
  EVENT_DATA_TYPES,
  eventDataTagsFor,
  eventDataTagPrivacyCategory,
  isEventDataTag,
  type EventDataTag,
} from './eventDataTypes.js';
export { extractPaymentAmounts } from './paymentAmounts.js';
export {
  answeredSpecialCategoryQuestions,
  clearSpecialCategoryAnswers,
  consentAnswers,
  consentTexts,
  isSpecialCategory,
  extractPrivacyTags,
  taggedSpecialCategories,
  uncoveredConsentCategories,
  unconsentedQuestions,
  type UnconsentedOptions,
  type ConsentQuestion,
  type FormPrivacyTags,
  type PrivacyTaggedQuestion,
} from './privacyTags.js';
export {
  consentBasedCategories,
  formPrivacyIssues,
  hasPrivacyIssues,
  privacyIssueKind,
  type FormPrivacyIssueKind,
  type FormPrivacyIssues,
} from './privacyCompliance.js';
export { specialCategoryFieldTest } from './purgedFields.js';
export {
  reservedNameIssue,
  reservedNameUses,
  type ReservedNameIssue,
  type ReservedNameUse,
} from './reservedNames.js';
export {
  PATH_SEPARATOR,
  PATH_WILDCARD,
  answerPathOf,
  joinPath,
  valueAtPath,
  valuesAtPath,
} from './answerPaths.js';
export {
  extractFormFields,
  extractEventDataTypes,
  getSelectOptions,
} from './fields.js';
export {
  TableTemplateReferenceChecker,
  type TableTemplateIssue,
} from './tableTemplateReferences.js';
export {
  selectFileByLocale,
  EVENT_LOGO_SLOT,
  EVENT_BANNER_SLOT,
  FILE_VARIABLE,
} from './files.js';
export { fileSlotPath, type FileSlotOptions } from './fileSlots.js';
export {
  prepareEventSurvey,
  type EventSurvey,
  type EventSurveyData,
  type EventSurveyOptions,
} from './eventSurvey.js';
export type { GroupCountryMatch } from './questions/groupCountryMatch.js';
export { PARTICIPANT_ROLE, isParticipant } from './questions/role.question.js';
export {
  PAYMENT_TOTAL_MODES,
  type PaymentTotalMode,
} from './properties/showPaymentTotal.js';
export {
  EVENT_DATA_TYPE_PROPERTY,
  PRICE_PROPERTY,
  PRIVACY_CATEGORY_PROPERTY,
  PRIVACY_CONSENT_PROPERTY,
  PRIVACY_CONSENT_PURPOSE_PROPERTY,
  PRIVACY_CONSENT_FOR_PROPERTY,
  eventDataTypeOf,
  isPriced,
  priceOf,
  privacyCategoryOf,
  isConsent,
  consentCategoriesOf,
  consentPurposesOf,
} from './properties/accessors.js';
export { EVENT_DATA_TYPE_EDITOR } from './properties/eventDataType.js';
export {
  REGISTRATION_PROPERTY_CATEGORY,
  REGISTRATION_PROPERTY_CATEGORY_INDEX,
} from './properties/category.js';
