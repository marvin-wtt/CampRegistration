<template>
  <q-input
    v-model="formattedValue"
    v-bind="attrs"
    mask="#.##"
    fill-mask="0"
    reverse-fill-mask
    input-class="text-right"
    suffix="€"
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

<script lang="ts" setup>
import { computed, useAttrs } from 'vue';
import { QInputSlots } from 'quasar';

const modelValue = defineModel<number>();
const attrs = useAttrs();
const slots = defineSlots<QInputSlots>();

const formattedValue = computed<string | undefined>({
  get() {
    return modelValue.value?.toFixed(2);
  },
  set(value) {
    modelValue.value = value != null ? parseFloat(value) : value;
  },
});
</script>

<style scoped></style>
