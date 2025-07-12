<template>
  <img
    v-if="isoCode && hasFlag(isoCode)"
    :src="`/flags/${isoCode}.svg`"
    :alt="`Flag of ${isoCode}`"
    class="flag-icon"
  />

  <span v-else>
    {{ country ?? locale }}
  </span>
</template>

<script lang="ts" setup>
import { hasFlag } from 'country-flag-icons';
import { defineProps, computed } from 'vue';

type Props =
  | {
      locale: string;
      country?: never;
    }
  | {
      locale?: never;
      country: string;
    };

const { country, locale } = defineProps<Props>();

const DEFAULT_COUNTRY_BY_LANG: Record<string, string> = {
  en: 'GB',
} as const;

const isoCode = computed<string>(() => {
  const code = locale ? localeToIso(locale) : country;

  return code?.toUpperCase() ?? '';
});

function localeToIso(locale: string): string | undefined {
  const tag = locale.replace('_', '-');
  const [lang, region] = tag.split('-');

  if (region) {
    return region;
  }

  if (!lang) {
    return undefined;
  }

  return DEFAULT_COUNTRY_BY_LANG[lang] ?? lang;
}
</script>

<style scoped>
.flag-icon {
  width: 1.5em;
  height: auto;
  vertical-align: middle;
}
</style>
