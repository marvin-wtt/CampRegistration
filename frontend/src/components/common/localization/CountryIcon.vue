<template>
  <i
    aria-hidden="true"
    role="presentation"
    class="fi country-icon q-icon"
    :class="className"
    :style
  />
</template>

<script lang="ts" setup>
import 'flag-icons/css/flag-icons.min.css';
import { computed, type StyleValue } from 'vue';

type Props =
  | {
      locale: string;
      country?: never;
      size?: string;
    }
  | {
      locale?: never;
      country: string;
      size?: string;
    };

const props = defineProps<Props>();

const overrides: Record<string, string> = {
  en: 'us', // Use US as default for english
};

const className = computed<string>(() => {
  const isoCode = props.country ?? localeToCountry(props.locale);

  return `fi-${isoCode}`;
});

const style = computed<StyleValue | null>(() => {
  if (!props.size) {
    return null;
  }

  const defaultSizes = {
    xs: 18,
    sm: 24,
    md: 32,
    lg: 38,
    xl: 46,
  } as const;

  return {
    fontSize:
      props.size in defaultSizes
        ? `${defaultSizes[props.size as keyof typeof defaultSizes]!}px`
        : props.size,
  };
});

function localeToCountry(value: string): string {
  // Use country as value for locales of type aa-AA
  if (value.length > 2) {
    if (!value.includes('-')) {
      throw new Error(`Invalid value for prop locale: ${value}`);
    }

    value = value.split('-')[1]!.toLowerCase();
  }

  if (value in overrides) {
    return overrides[value]!;
  }

  return value;
}
</script>

<style scoped>
.country-icon {
  width: 1em !important;
  height: auto !important;
}
</style>
