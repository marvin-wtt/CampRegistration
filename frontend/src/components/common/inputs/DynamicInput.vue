<template>
  <component
    :is="component"
    v-if="component"
    v-bind="props.element"
    v-model="modelValue"
    style="width: 100%"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { BaseComponent } from 'components/common/inputs/BaseComponent';
import {
  QCheckbox,
  QInput,
  QOptionGroup,
  QRadio,
  QSelect,
  QSlider,
  QToggle,
} from 'quasar';

const component = computed(() => {
  switch (props.element.componentType) {
    case 'option-group':
      return QOptionGroup;
    case 'checkbox':
      return QCheckbox;
    case 'input':
      return QInput;
    case 'radio':
      return QRadio;
    case 'select':
      return QSelect;
    case 'slider':
      return QSlider;
    case 'toggle':
      return QToggle;
  }

  return undefined;
});

interface Props {
  element: BaseComponent;
  modelValue?: unknown;
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

<style scoped></style>
