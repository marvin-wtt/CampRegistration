<template>
  <div class="row q-gutter-x-sm justify-center no-wrap">
    <q-field> </q-field>

    <q-input
      v-for="i in length"
      :key="i"
      v-model="fieldValues[i - 1]"
      v-bind="attrs"
      :ref="(el: QInput) => updateFieldRef(el, i - 1)"
      outlined
      name="otp"
      inputmode="numeric"
      maxlength="1"
      mask="#"
      input-class="text-center"
      style="width: 6ch"
      @keyup="(e: KeyboardEvent) => onKeyUp(e, i - 1)"
      @update:model-value="(v) => onUpdate(v, i - 1)"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUpdate, ref, useAttrs, watch } from 'vue';
import { QInput } from 'quasar';

const model = defineModel<string>();
const attrs = useAttrs();
const { length = 6 } = defineProps<{
  length?: number;
}>();

const fields = ref<QInput[]>([]);
const fieldValues = ref<string[]>([]);

watch(fieldValues, () => {
  const nonNullFields = fieldValues.value.filter((value) => value);

  model.value = nonNullFields.length === length ? nonNullFields.join('') : '';
});

// make sure to reset the refs before each update
onBeforeUpdate(() => {
  fields.value = [];
});

const updateFieldRef = (element: QInput, index: number) => {
  if (element) {
    fields.value[index] = element;
  }
};

const focus = (index: number) => {
  if (index < 0) {
    return;
  }

  if (index < length) {
    fields.value[index]?.select();
  } else if (model.value) {
    fields.value[index - 1]?.blur();
  }
};

const onUpdate = (value: unknown, index: number) => {
  if (value) {
    focus(index + 1);
  }
};

const onKeyUp = (event: KeyboardEvent, index: number) => {
  const key = event.key;

  if (['Tab', 'Shift', 'Meta', 'Control', 'Alt'].includes(key)) {
    return;
  }

  if (['Delete'].includes(key)) {
    return;
  }

  if (key === 'ArrowLeft' || key === 'Backspace') {
    focus(index - 1);
  } else if (key === 'ArrowRight') {
    focus(index + 1);
  }
};
</script>

<style scoped></style>
