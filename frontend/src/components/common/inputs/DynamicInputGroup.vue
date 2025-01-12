<template>
  <q-list>
    <q-item
      v-for="element in props.elements"
      :key="element.name"
    >
      <dynamic-input
        v-model="modelValue[element.name]"
        :element="element"
      />
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { type BaseComponent } from 'components/common/inputs/BaseComponent';
import DynamicInput from 'components/common/inputs/DynamicInput.vue';
import { computed } from 'vue';

interface Props {
  elements: BaseComponent[];
  modelValue?: Record<string, unknown>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
}>();

const modelValue = computed({
  get: () => props.modelValue ?? {},
  set: (value) => emit('update:modelValue', value),
});
</script>

<style scoped></style>
