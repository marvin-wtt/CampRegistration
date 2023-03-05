<template>
  <q-icon
    :name="name"
    :size="size"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  locale: string;
  size?: string;
}

const props = defineProps<Props>();

const name = computed<string>(() => {
  const language = props.locale.split('_')[0].toLowerCase();
  return `img:flags/${language}.svg`;
});
</script>

<style scoped></style>
