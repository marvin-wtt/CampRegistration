<template>
  <q-input
    v-model="modelValue"
    :model-modifiers="props.modelModifiers"
    v-bind="$attrs"
    type="textarea"
  >
    <template
      v-for="(data, name, index) in $slots"
      :key="index"
      #[name]
    >
      <slot
        :name="name"
        v-bind="data"
      />
    </template>
  </q-input>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  modelValue: string | undefined;
  modelModifiers?: Record<string, boolean>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void;
}>();

const modelValue = computed<string>({
  get: () => JSON.stringify(props.modelValue),
  set: (value: string) => emit('update:modelValue', JSON.parse(value)),
});
</script>

<style scoped>
.margin-between > * + * {
  margin-top: 0.5rem;
}

.layer1,
.layer2 {
  grid-column: 1;
  grid-row: 1;
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}

.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
</style>

<i18n lang="yaml" locale="en">
actions:
  enable: 'Use translations'
  disable: "Don't use translations"
</i18n>

<i18n lang="yaml" locale="de">
actions:
  enable: 'Übersetzungen verwenden'
  disable: 'Keine Übersetzungen verwenden'
</i18n>

<i18n lang="yaml" locale="fr">
actions:
  enable: 'Utiliser les traductions'
  disable: 'Ne pas utiliser les traductions'
</i18n>
