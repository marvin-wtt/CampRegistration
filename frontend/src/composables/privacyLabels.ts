import { useI18n } from 'vue-i18n';
import {
  isCustomKey,
  type PrivacyDataCategoryEntry,
  type PrivacyPurposeEntry,
  type PrivacyRecipientEntry,
  type PrivacyRetentionException,
} from '@camp-registration/common/privacy';
import { useObjectTranslation } from '@/composables/objectTranslation';

/**
 * How a catalogue entry is named. Shared by everything that displays notice
 * content — the notice a registrant reads, the authoring wizard and a camp's
 * baseline summary — because an entry that reads differently in the editor
 * than in the published notice is a bug the author cannot see.
 *
 * A catalogue entry reads from the shared, pre-translated vocabulary; an entry
 * the organization added itself can only read from the name it gave it.
 */
export function usePrivacyLabels() {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { t, te } = useI18n({ useScope: 'global' });
  const { to } = useObjectTranslation();

  function categoryLabel(entry: PrivacyDataCategoryEntry): string {
    return isCustomKey(entry.key)
      ? to(entry.label ?? '')
      : t(`privacy.dataCategory.${entry.key}`);
  }

  function purposeLabel(entry: PrivacyPurposeEntry): string {
    return isCustomKey(entry.key)
      ? to(entry.label ?? '')
      : t(`privacy.purpose.${entry.key}`);
  }

  /** A catalogue purpose is already translated; one the author added is not. */
  function exceptionLabel(exception: PrivacyRetentionException): string {
    return isCustomKey(exception.scope)
      ? to(exception.label ?? '')
      : t(`privacy.purpose.${exception.scope}`);
  }

  function recipientLabel(entry: PrivacyRecipientEntry): string {
    return t(`privacy.recipient.${entry.key}`);
  }

  /** Not every country has a `country.*` key; fall back to the ISO code. */
  function countryLabel(code: string): string {
    const key = `country.${code.toLowerCase()}`;

    return te(key) ? t(key) : code.toUpperCase();
  }

  return {
    categoryLabel,
    purposeLabel,
    exceptionLabel,
    recipientLabel,
    countryLabel,
  };
}
