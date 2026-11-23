import { computed, inject, provide, type InjectionKey } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  frameworkRecord,
  isCustomKey,
  LEGAL_BASIS_KEYS,
  noticeFramework,
  type CitationKey,
  type FrameworkLabelKey,
  type LegalBasisKey,
  type PrivacyNoticeContent,
  type SpecialCategoryBasisKey,
  type TransferSafeguard,
  type PrivacyDataCategoryEntry,
  type PrivacyPurposeEntry,
  type PrivacyRecipientEntry,
  type PrivacyRetentionException,
} from '@camp-registration/common/privacy';
import { useObjectTranslation } from '@/composables/objectTranslation';

/** The notice whose law is cited: its framework and the record version. */
export type NoticeLawGetter = () =>
  | Pick<PrivacyNoticeContent, 'framework' | 'frameworkVersion'>
  | null
  | undefined;

const PRIVACY_FRAMEWORK: InjectionKey<NoticeLawGetter> =
  Symbol('privacyFramework');

/**
 * The law a privacy page is written under, for the controls inside it: they
 * cite its provisions and use its wording (docs/privacy.md, 4).
 */
export function providePrivacyFramework(notice: NoticeLawGetter) {
  provide(PRIVACY_FRAMEWORK, notice);
}

/**
 * How a catalogue entry is named. Shared by everything that displays notice
 * content — the notice a registrant reads, the authoring wizard and a event's
 * baseline summary — because an entry that reads differently in the editor
 * than in the published notice is a bug the author cannot see.
 *
 * A catalogue entry reads from the shared, pre-translated vocabulary; an entry
 * the organization added itself can only read from the name it gave it.
 */
export function usePrivacyLabels(notice?: NoticeLawGetter) {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { t, te } = useI18n({ useScope: 'global' });
  const { to } = useObjectTranslation();

  // The notice passes its own law; controls on a privacy page get the page's.
  const currentNotice = notice ?? inject(PRIVACY_FRAMEWORK, () => null);
  const record = computed(() => {
    const content = currentNotice();
    return frameworkRecord(noticeFramework(content), content?.frameworkVersion);
  });

  /** The law's own wording where it phrases a ground differently. */
  function lawLabel(key: FrameworkLabelKey): string {
    const label = record.value?.labels?.[key];
    return label ? to(label) : t(`privacy.${key}`);
  }

  /** The provision in the current law, empty where the platform has none. */
  function cite(key: CitationKey): string {
    const citation = record.value?.citations[key];
    return citation ? to(citation) : '';
  }

  function withCitation(label: string, key: CitationKey): string {
    const citation = cite(key);
    return citation ? `${label} (${citation})` : label;
  }

  function legalBasisLabel(key: LegalBasisKey | null | undefined): string {
    if (!key) {
      return '';
    }
    return withCitation(lawLabel(`legalBasis.${key}`), `legalBasis.${key}`);
  }

  /** What the law adds to a basis, for the editor; empty for most. */
  function legalBasisCaution(key: LegalBasisKey | null | undefined): string {
    const caution = key ? record.value?.cautions?.[`legalBasis.${key}`] : null;
    return caution ? to(caution) : '';
  }

  function specialBasisLabel(
    key: SpecialCategoryBasisKey | null | undefined,
  ): string {
    if (!key) {
      return '';
    }
    return withCitation(
      lawLabel(`specialCategoryBasis.${key}`),
      `specialCategoryBasis.${key}`,
    );
  }

  function specialBasisCondition(key: SpecialCategoryBasisKey): string {
    return lawLabel(`specialCategoryCondition.${key}`);
  }

  function safeguardLabel(key: TransferSafeguard): string {
    const label = t(`privacy.transferSafeguard.${key}`);
    return key === 'derogation'
      ? withCitation(label, 'transferDerogation')
      : label;
  }

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
    return isCustomKey(entry.key)
      ? to(entry.label ?? '')
      : t(`privacy.recipient.${entry.key}`);
  }

  /** Not every country has a `country.*` key; fall back to the ISO code. */
  function countryLabel(code: string): string {
    const key = `country.${code.toLowerCase()}`;

    return te(key) ? t(key) : code.toUpperCase();
  }

  /** The legal bases, as options for a select. */
  const legalBasisOptions = computed(() =>
    LEGAL_BASIS_KEYS.map((key) => ({
      value: key,
      label: legalBasisLabel(key),
    })),
  );

  return {
    record,
    cite,
    withCitation,
    legalBasisLabel,
    legalBasisCaution,
    specialBasisLabel,
    specialBasisCondition,
    safeguardLabel,
    legalBasisOptions,
    categoryLabel,
    purposeLabel,
    exceptionLabel,
    recipientLabel,
    countryLabel,
  };
}
