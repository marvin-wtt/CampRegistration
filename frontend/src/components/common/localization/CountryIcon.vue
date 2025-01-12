<template>
  <q-icon :name>
    <slot />
  </q-icon>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

type Props =
  | {
      locale: string;
      country?: never;
    }
  | {
      locale?: never;
      country: string;
    };

const props = defineProps<Props>();

const overrides: Record<string, string> = {
  en: 'us', // Use US as default for english
};

const acceptedValues = ['de', 'fr', 'us'];

const name = computed<string>(() => {
  const filename = props.country ?? localeToCountry(props.locale);

  if (!acceptedValues.includes(filename)) {
    return 'question_mark';
  }

  return `img:/flags/${filename}.svg`;
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

<style scoped></style>
