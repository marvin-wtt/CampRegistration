<template>
  <q-field
    v-model="formattedValue"
    v-bind="attrs"
    suffix="€"
  >
    <template
      #control="{ id, floatingLabel, modelValue: moneyModelValue, emitValue }"
    >
      <money
        v-show="floatingLabel"
        v-bind="moneyFormat"
        :id="id"
        class="q-field__input text-right"
        :model-value="moneyModelValue"
        @update:model-value="emitValue"
      />
    </template>

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
  </q-field>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from 'vue';
import { QInputSlots } from 'quasar';
import { Money } from 'v-money3';

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

const moneyFormat = {
  mask: true,
  prefix: '',
  suffix: '', // Set by field
  thousands: '.',
  decimal: ',',
  precision: 2,
  disableNegative: false,
  allowBlank: false,
};
</script>

<style scoped></style>
