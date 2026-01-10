<template>
  <div class="row q-gutter-x-sm justify-center no-wrap">
    <q-input
      v-for="i in length"
      :key="i"
      v-model="fieldValues[i - 1]"
      v-bind="attrs"
      :ref="(el: QInput) => updateFieldRef(el, i - 1)"
      :rules="[
        (val?: string) => !required || (!!val && val.trim().length === 1),
      ]"
      hide-bottom-space
      outlined
      name="otp"
      inputmode="numeric"
      maxlength="1"
      mask="#"
      input-class="text-center"
      error-message=""
      no-error-icon
      style="width: 6ch"
      @paste="(e: ClipboardEvent) => onPaste(e, i - 1)"
      @keyup="(e: KeyboardEvent) => onKeyUp(e, i - 1)"
      @update:model-value="(v) => onUpdate(v, i - 1)"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUpdate, ref, useAttrs } from 'vue';
import { QInput } from 'quasar';

const model = defineModel<string>();
const attrs = useAttrs();
const { length = 6, required = false } = defineProps<{
  length?: number;
  required?: boolean;
}>();

const fields = ref<QInput[]>([]);
const fieldValues = ref<string[]>([]);

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
    return;
  }

  // If the index is out of bounds, unselect the last field
  fields.value[length - 1]?.select();
  fields.value[length - 1]?.blur();
};

const onUpdate = (value: string | number | null, index: number) => {
  model.value = fieldValues.value.join('');

  if (!value) {
    return;
  }

  focus(index + 1);
};

const onKeyUp = (event: KeyboardEvent, index: number) => {
  const key = event.key;

  switch (key) {
    case 'Delete':
      fieldValues.value[index] = '';
      break;
    case 'ArrowLeft':
    case 'Backspace':
      focus(index - 1);
      break;
    case 'ArrowRight':
      focus(index + 1);
      break;
  }
};

function onPaste(event: ClipboardEvent, index: number) {
  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return;
  }

  const pastedData = clipboardData.getData('text/plain');
  if (pastedData.length > length - index) {
    return;
  }

  for (let i = index; i < pastedData.length; i++) {
    fieldValues.value[index + i] = pastedData[i]!;
  }

  model.value = fieldValues.value.join('');

  void nextTick(() => {
    // Postpone focus to wait for initial update by the input
    focus(index + pastedData.length);
  });
}
</script>

<style scoped></style>
