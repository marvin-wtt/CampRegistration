<template>
  <q-input
    v-model="model"
    v-bind="inputProps"
    :model-modifiers="modifiers"
    :mask
  >
    <!-- Parent slots -->
    <template
      v-for="(_, name) in slots"
      :key="name"
      #[name]
    >
      <slot :name />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type QInputProps } from 'quasar';
import {
  type ForwardedFieldSlots,
  usePassthroughProps,
} from '@/composables/passthroughProps';

type ModelValueType = string | undefined | null;

// The mask belongs to the locale format this input exists for.
type Props = Omit<QInputProps, 'modelValue' | 'onUpdate:modelValue' | 'mask'>;

const [model, modifiers] = defineModel<ModelValueType>();
const slots = defineSlots<ForwardedFieldSlots>();

const props = defineProps<Props>();

const inputProps = usePassthroughProps(props);

const mask = computed<string>(() => {
  // Leave another character to allow the watcher to swap it
  if (!model.value || model.value.length <= 2) {
    return 'aaA';
  }

  return 'aa-AA';
});
</script>

<style scoped></style>
