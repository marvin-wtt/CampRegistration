<template>
  <div
    class="text-center rounded-borders"
    :style="badgeStyles"
  >
    {{ to(event.title) }}
  </div>
</template>

<script lang="ts" setup>
import type { ProgramEvent } from '@camp-registration/common/entities';
import { computed, StyleValue } from 'vue';
import { useObjectTranslation } from 'src/composables/objectTranslation';

interface Props {
  event: ProgramEvent;
}

const props = defineProps<Props>();

const { to } = useObjectTranslation();

const backgroundColor = computed<string>(() => {
  return props.event.color ?? '#0000ff';
});

const badgeStyles = computed<StyleValue>(() => {
  return {
    backgroundColor: backgroundColor.value,
  };
});
</script>

<style scoped></style>
