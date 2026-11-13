<template>
  <!-- Cash-register entry: only digits are typed, the field always shows the
       formatted amount (4780 → 47,80). Validated on save only: inside a sheet,
       focus moves while it opens, which must not read as "left empty". -->
  <q-input
    ref="inputRef"
    :model-value="display"
    :label
    :autofocus
    :placeholder="zero"
    :rules="[
      () => !required || model !== null || t('finance.validation.amount'),
    ]"
    :input-class="large ? 'text-h6 amount-native' : 'amount-native'"
    lazy-rules="ondemand"
    inputmode="numeric"
    enterkeyhint="next"
    autocomplete="off"
    hide-bottom-space
    outlined
    rounded
    @update:model-value="onInput"
    @focus="moveCaretToEnd"
  >
    <template #append>
      <span class="text-body1">{{ symbol }}</span>
      <!-- Field actions, e.g. a toggle for rarely needed extra input. -->
      <slot name="append" />
    </template>
  </q-input>
</template>

<script lang="ts" setup>
import { computed, nextTick, useTemplateRef, watch } from 'vue';
import type { QInput } from 'quasar';
import { useI18n } from 'vue-i18n';
import { currencySymbol } from '@camp-registration/common/utils';
import { amountDigits, formatAmountDigits } from '@/utils/moneyInput';

const {
  currency,
  label = undefined,
  autofocus = false,
  required = true,
  large = false,
} = defineProps<{
  currency: string;
  label?: string | undefined;
  autofocus?: boolean;
  required?: boolean;
  /** The headline amount of a capture form. */
  large?: boolean;
}>();

/** Minor units; `null` while empty. */
const model = defineModel<number | null>({ required: true });

const { t, locale } = useI18n();
const inputRef = useTemplateRef<QInput>('inputRef');

const symbol = computed(() => currencySymbol(currency, locale.value));
const zero = computed(() => formatAmountDigits(0, currency, locale.value));
const display = computed(() =>
  model.value !== null
    ? formatAmountDigits(model.value, currency, locale.value)
    : '',
);

function onInput(value: string | number | null) {
  const digits = amountDigits(String(value ?? ''));
  model.value = digits ? Number(digits) : null;

  // The field shows the formatted amount even when the value didn't change
  // (a letter typed, a separator deleted), with the caret where typing goes on.
  void nextTick(() => {
    const el = inputRef.value?.getNativeElement() as
      HTMLInputElement | undefined;
    if (el && el.value !== display.value) {
      el.value = display.value;
    }
    moveCaretToEnd();
  });
}

function moveCaretToEnd() {
  const el = inputRef.value?.getNativeElement() as HTMLInputElement | undefined;
  if (el) {
    el.setSelectionRange(el.value.length, el.value.length);
  }
}

watch(model, () => {
  // Once an error shows, it clears as soon as there is an amount.
  if (inputRef.value?.hasError) {
    void inputRef.value.validate();
  }
});
</script>

<style scoped>
:deep(.amount-native) {
  font-variant-numeric: tabular-nums;
}
</style>
