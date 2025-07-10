<template>
  <img
    v-if="isoCode && hasFlag(isoCode)"
    :src="`/flags/${isoCode}.svg`"
    :alt="`Flag of ${isoCode}`"
    class="flag-icon"
  />

  <span v-else>
    {{ isoCode }}
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

const isoCode = computed<string>(() => {
  const code = locale ? localeToIso(locale) : country;

  return code?.toUpperCase() ?? '';
});

function localeToIso(locale: string): string {
  return locale.length === 2 ? locale : locale.substring(2, locale.length);
}
</script>

<style scoped>
.flag-icon {
  width: 1.5em;
  height: auto;
  vertical-align: middle;
}
</style>
