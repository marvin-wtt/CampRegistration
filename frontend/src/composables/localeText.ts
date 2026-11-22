import { computed, type Ref, type WritableComputedRef } from 'vue';
import type { Translatable } from '@camp-registration/common/entities';

/** The text of one locale; a plain string stands for every locale. */
export function localeText(
  value: Translatable | null | undefined,
  locale: string,
): string {
  if (!value) {
    return '';
  }

  return typeof value === 'string' ? value : (value[locale] ?? '');
}

/**
 * `value` with one locale's text replaced, or removed when empty. Null once no
 * locale has text left. A plain string becomes per-locale text.
 */
export function withLocaleText(
  value: Translatable | null | undefined,
  locale: string,
  text: string,
): Translatable | null {
  const current = !value || typeof value === 'string' ? {} : { ...value };

  if (text) {
    current[locale] = text;
  } else {
    delete current[locale];
  }

  return Object.keys(current).length > 0 ? current : null;
}

/** A model for editing one locale of a translatable field at a time. */
export function useLocaleTextModel(
  field: {
    get: () => Translatable | null | undefined;
    set: (value: Translatable | null) => void;
  },
  locale: Ref<string>,
): WritableComputedRef<string> {
  return computed({
    get: () => localeText(field.get(), locale.value),
    set: (text: string) => {
      field.set(withLocaleText(field.get(), locale.value, text));
    },
  });
}
