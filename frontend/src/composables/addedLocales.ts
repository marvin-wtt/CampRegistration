import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { useI18n } from 'vue-i18n';

/** A locale's language name in the user's own language, else its code. */
export function useLanguageName(): (key: string) => string {
  const { locale } = useI18n({ useScope: 'global' });

  return (key) => {
    try {
      const names = new Intl.DisplayNames([locale.value], { type: 'language' });
      return names.of(key) ?? key.toUpperCase();
    } catch {
      return key.toUpperCase();
    }
  };
}

/**
 * Locales added one at a time: the default (the user's own, else the first),
 * every locale with text, and those the author added, in the order added.
 * A locale that was shown stays shown until removed, so clearing its text by
 * hand does not pull the field away mid-edit.
 */
export function useAddedLocales(
  locales: MaybeRefOrGetter<string[]>,
  filled: MaybeRefOrGetter<string[]>,
) {
  const { locale } = useI18n({ useScope: 'global' });

  const added = ref<string[]>([]);
  const kept = ref<string[]>([]);

  watch(
    () => toValue(filled),
    (value) => {
      const fresh = value.filter((key) => !kept.value.includes(key));
      if (fresh.length) {
        kept.value = [...kept.value, ...fresh];
      }
    },
    { immediate: true },
  );

  const defaultLocale = computed<string | undefined>(() => {
    const keys = toValue(locales);
    const language = locale.value.split('-')[0];
    return keys.find((key) => key === language) ?? keys[0];
  });

  const shownLocales = computed<string[]>(() => {
    const keys = toValue(locales);
    const rank = (key: string) => {
      if (key === defaultLocale.value) {
        return -1;
      }
      const index = added.value.indexOf(key);
      return index === -1 ? keys.indexOf(key) : keys.length + index;
    };
    return keys
      .filter(
        (key) =>
          key === defaultLocale.value ||
          kept.value.includes(key) ||
          added.value.includes(key),
      )
      .sort((a, b) => rank(a) - rank(b));
  });

  const missingLocales = computed<string[]>(() =>
    toValue(locales).filter((key) => !shownLocales.value.includes(key)),
  );

  function canRemove(key: string): boolean {
    return key !== defaultLocale.value;
  }

  function add(key: string) {
    if (!added.value.includes(key)) {
      added.value = [...added.value, key];
    }
  }

  // The caller clears the locale's text; this only hides it again.
  function remove(key: string) {
    added.value = added.value.filter((k) => k !== key);
    kept.value = kept.value.filter((k) => k !== key);
  }

  return {
    defaultLocale,
    shownLocales,
    missingLocales,
    canRemove,
    add,
    remove,
  };
}
