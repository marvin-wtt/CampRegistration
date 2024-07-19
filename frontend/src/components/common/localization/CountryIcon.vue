<template>
  <q-icon
    :name="name"
    :size="size"
  >
    <slot />
  </q-icon>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  locale: string;
  size?: string;
}

const props = defineProps<Props>();

const acceptedValues = ['de', 'fr', 'en', 'us'];

const name = computed<string>(() => {
  const language = props.locale.split('-')[0].toLowerCase();

  if (!acceptedValues.includes(language)) {
    return 'question_mark';
  }

  return `img:/flags/${language}.svg`;
});
</script>

<style scoped></style>
