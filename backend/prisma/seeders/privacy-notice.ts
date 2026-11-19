import { emptyPrivacyNoticeContent } from '@camp-registration/common/privacy';
import type { PrivacyNoticeContent } from '@camp-registration/common/privacy';

/**
 * The notice every seeded organization publishes. It declares what the
 * seeded forms and presets collect — health, allergies and medication on
 * explicit consent — so their registrations pass the privacy check
 * (docs/privacy.md, 5). Forest Week is the deliberate exception: its form asks
 * for allergies without a consent question.
 */
export const SEED_PRIVACY_NOTICE: PrivacyNoticeContent = {
  ...emptyPrivacyNoticeContent(),
  purposes: [
    { key: 'registration_administration', legalBasis: 'contract' },
    { key: 'event_organisation', legalBasis: 'contract' },
    { key: 'participant_communication', legalBasis: 'contract' },
    { key: 'catering', legalBasis: 'contract' },
    { key: 'medical_care', legalBasis: 'consent' },
  ],
  dataCategories: [
    { key: 'identity' },
    { key: 'contact' },
    { key: 'date_of_birth' },
    { key: 'address' },
    { key: 'guardian_contact' },
    { key: 'emergency_contact' },
    { key: 'dietary' },
    { key: 'health', specialCategoryBasis: 'explicit_consent' },
    { key: 'allergies', specialCategoryBasis: 'explicit_consent' },
    { key: 'medication', specialCategoryBasis: 'explicit_consent' },
  ],
  recipients: [
    { key: 'event_staff' },
    { key: 'platform_operator' },
    { key: 'medical_provider' },
    { key: 'catering_provider' },
  ],
};
