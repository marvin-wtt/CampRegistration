import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/** A group's name in the UI language, from its country code: `pl` → Polen. */
export function useGroupLabel() {
  const { locale } = useI18n({ useScope: 'global' });
  const regionNames = computed(() => {
    try {
      return new Intl.DisplayNames([locale.value], { type: 'region' });
    } catch {
      return null;
    }
  });

  return (group: string): string => {
    const upper = group.toUpperCase();
    try {
      return regionNames.value?.of(upper) ?? upper;
    } catch {
      return upper;
    }
  };
}
