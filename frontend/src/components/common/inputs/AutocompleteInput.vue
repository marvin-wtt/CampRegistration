<template>
  <q-select
    v-model="modelValue"
    v-bind="attrs"
    :options
    use-input
    hide-selected
    fill-input
    input-debounce="0"
    @input-value="setModel"
    @filter="filterFn"
  >
    <template
      v-for="(data, name, index) in slots"
      :key="index"
      #[name]
    >
      <!-- TODO Why is this an error? -->
      <!-- @vue-ignore -->
      <slot
        :name="name"
        v-bind="data"
      />
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed, ref, useAttrs } from 'vue';
import { type QSelectSlots } from 'quasar';

const modelValue = defineModel<string | null>();
const attrs = useAttrs();
const slots = defineSlots<QSelectSlots>();

const options = ref<unknown[]>();

function setModel(val: string | null): void {
  modelValue.value = val?.length === 0 ? null : val;
}

const attrOptions = computed<string[]>(() => {
  if ('options' in attrs && Array.isArray(attrs.options)) {
    return attrs.options.map(valueText);
  }

  return [];
});

function filterFn(val: string, update: (cb: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();

    options.value = attrOptions.value.filter(
      (v) => v.toLowerCase().indexOf(needle) > -1,
    );
  });
}

function valueText(val: unknown): string {
  if (typeof val === 'string') {
    return val;
  }

  if (
    typeof val === 'object' &&
    val &&
    'label' in val &&
    typeof val.label === 'string'
  ) {
    return val.label;
  }

  if (typeof val === 'number') {
    return val.toString();
  }

  return '';
}
</script>

<style scoped></style>
