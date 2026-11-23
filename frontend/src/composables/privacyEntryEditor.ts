import type { Ref } from 'vue';
import {
  DEFAULT_SPECIAL_CATEGORY_BASIS,
  needsLegalReference,
  isSpecialCategory,
  type PrivacyDataCategoryEntry,
  type PrivacyDataCategoryRef,
  type PrivacyRecipientEntry,
  type PrivacyRecipientRef,
  type SpecialCategoryBasisKey,
} from '@camp-registration/common/privacy';
import type { Translatable } from '@camp-registration/common/entities';

/** The entry lists an organization notice and an event addendum share. */
interface EditableEntries {
  dataCategories?: PrivacyDataCategoryEntry[];
  recipients?: PrivacyRecipientEntry[];
}

/**
 * Editing the data categories and recipients of a notice being written, the
 * organization's or an event's: one behaviour for both editors.
 */
export function usePrivacyEntryEditor(content: Ref<EditableEntries>) {
  function dataCategory(key: PrivacyDataCategoryRef) {
    return content.value.dataCategories?.find((entry) => entry.key === key);
  }
  function hasDataCategory(key: PrivacyDataCategoryRef): boolean {
    return dataCategory(key) !== undefined;
  }
  function addDataCategory(key: PrivacyDataCategoryRef) {
    if (hasDataCategory(key)) {
      return;
    }

    // Pre-select the Art. 9 basis nearly every event actually relies on,
    // rather than opening with an empty required field.
    content.value.dataCategories = [
      ...(content.value.dataCategories ?? []),
      isSpecialCategory(key)
        ? { key, specialCategoryBasis: DEFAULT_SPECIAL_CATEGORY_BASIS }
        : { key },
    ];
  }
  function removeDataCategory(key: PrivacyDataCategoryRef) {
    content.value.dataCategories = (content.value.dataCategories ?? []).filter(
      (entry) => entry.key !== key,
    );
  }
  function toggleDataCategory(key: PrivacyDataCategoryRef, on: boolean) {
    if (on) {
      addDataCategory(key);
    } else {
      removeDataCategory(key);
    }
  }
  function setSpecialBasis(
    key: PrivacyDataCategoryRef,
    value: SpecialCategoryBasisKey | null | undefined,
  ) {
    const entry = dataCategory(key);
    if (entry) {
      entry.specialCategoryBasis = value ?? null;
      // The server keeps it only with a basis that names a law.
      if (!needsLegalReference(entry.specialCategoryBasis)) {
        entry.legalReference = null;
      }
    }
  }

  function setLegalReference(
    key: PrivacyDataCategoryRef,
    value: Translatable | null | undefined,
  ) {
    const entry = dataCategory(key);
    if (entry) {
      entry.legalReference = value ?? null;
    }
  }

  function recipient(key: PrivacyRecipientRef) {
    return content.value.recipients?.find((entry) => entry.key === key);
  }
  function hasRecipient(key: PrivacyRecipientRef): boolean {
    return recipient(key) !== undefined;
  }
  function addRecipient(key: PrivacyRecipientRef) {
    if (!hasRecipient(key)) {
      content.value.recipients = [...(content.value.recipients ?? []), { key }];
    }
  }
  function removeRecipient(key: PrivacyRecipientRef) {
    content.value.recipients = (content.value.recipients ?? []).filter(
      (entry) => entry.key !== key,
    );
  }
  function toggleRecipient(key: PrivacyRecipientRef, on: boolean) {
    if (on) {
      addRecipient(key);
    } else {
      removeRecipient(key);
    }
  }
  function setRecipientName(key: PrivacyRecipientRef, value: string) {
    const entry = recipient(key);
    if (entry) {
      entry.name = value || null;
    }
  }

  return {
    dataCategory,
    hasDataCategory,
    addDataCategory,
    removeDataCategory,
    toggleDataCategory,
    setSpecialBasis,
    setLegalReference,
    recipient,
    hasRecipient,
    addRecipient,
    removeRecipient,
    toggleRecipient,
    setRecipientName,
  };
}
