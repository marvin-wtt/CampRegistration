import httpStatus from 'http-status';
import {
  REGISTRATION_CONSENT_CHANGED,
  REGISTRATION_CONSENT_MISSING,
} from '@camp-registration/common/entities';
import { consentBasedCategories } from '@camp-registration/common/form';
import type { ComposedPrivacyNotice } from '@camp-registration/common/privacy';
import ApiError from '#core/router/ApiError';
import type { RegistrationForm } from './registration.form.js';

/**
 * Refuses answers to sensitive questions given without the consent they rest
 * on (Art. 9(1)): processing them would have no basis. Checked on the data as
 * submitted, so a hidden question cannot slip an answer through.
 */
export function assertConsentsGiven(
  form: RegistrationForm,
  notice: ComposedPrivacyNotice | null,
): void {
  const missing = form.unconsentedQuestions(consentBasedCategories(notice));

  if (missing.length > 0) {
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      `Answered without the consent it needs: ${missing.join(', ')}`,
      { code: REGISTRATION_CONSENT_MISSING },
    );
  }
}

/**
 * Refuses a submission whose consent wording changed while its form was open,
 * so the stored text is the one the person agreed to. `displayed` is untrusted:
 * it is only compared, never stored. Without it (API clients, managers' forms)
 * nothing is compared.
 */
export function assertConsentTextsUnchanged(
  given: Record<string, string>,
  displayed: Record<string, string> | undefined,
): void {
  if (!displayed) {
    return;
  }

  const changed = Object.entries(given).some(
    ([name, text]) => displayed[name] !== text,
  );
  if (changed) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'A consent text changed while the form was open',
      { code: REGISTRATION_CONSENT_CHANGED },
    );
  }
}
