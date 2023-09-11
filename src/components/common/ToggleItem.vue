<template>
  <q-item
    v-ripple
    tag="label"
  >
    <q-item-section>
      <q-item-label>{{ props.label }}</q-item-label>
      <q-item-label caption>{{ props.hint }}</q-item-label>
    </q-item-section>
    <q-item-section avatar>
      <q-toggle
        v-model="modelValue"
        :color="props.color"
      />
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  modelValue: boolean | undefined;
  label: string;
  hint?: string;
  color?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
}>();

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>
