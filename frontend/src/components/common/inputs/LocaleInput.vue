<template>
  <q-input
    v-model="model"
    v-bind="attrs"
    :model-modifiers="modifiers"
    :mask
  >
    <template
      v-for="(data, name, index) in slots"
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

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { type QInputSlots } from 'quasar';

type ModelValueType = string | undefined | null;

const [model, modifiers] = defineModel<ModelValueType>();
const attrs = useAttrs();
const slots = defineSlots<QInputSlots>();

const mask = computed<string>(() => {
  // Leave another character to allow the watcher to swap it
  if (!model.value || model.value.length <= 2) {
    return 'aaA';
  }

  return 'aa-AA';
});
</script>

<style scoped></style>
