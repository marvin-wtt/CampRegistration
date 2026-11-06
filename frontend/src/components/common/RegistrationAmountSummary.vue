<template>
  <div
    v-if="model.shown"
    class="amount-summary bg-surface-container-high rounded-xl"
    data-test="registration-amount-summary"
  >
    <div class="row items-center no-wrap total">
      <q-avatar
        color="primary-container"
        icon="receipt_long"
        size="40px"
        text-color="on-primary-container"
      />
      <span class="col text-subtitle1 text-on-surface">{{ t('total') }}</span>
      <span
        aria-live="polite"
        class="figure amount text-h5 text-primary"
      >
        {{ formattedAmount }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatMoney } from '@camp-registration/common/utils';
import type { AmountDueState } from '@/lib/surveyJs/amountDue';

// Rendered by survey-vue3-ui as a layout element, which passes its data as `model`.
const { model } = defineProps<{ model: AmountDueState }>();

const { t, locale } = useI18n();

const formattedAmount = computed(() =>
  formatMoney(model.amount, model.currency, locale.value),
);
</script>

<style scoped>
.amount-summary {
  padding: 16px;
  margin-bottom: 16px;
}

.total {
  gap: 16px;
}

.figure {
  font-variant-numeric: tabular-nums;
}

.amount {
  font-weight: 600;
}
</style>

<i18n lang="yaml" locale="en">
total: 'Total'
</i18n>

<i18n lang="yaml" locale="de">
total: 'Gesamtbetrag'
</i18n>

<i18n lang="yaml" locale="fr">
total: 'Montant total'
</i18n>

<i18n lang="yaml" locale="pl">
total: 'Kwota całkowita'
</i18n>

<i18n lang="yaml" locale="cs">
total: 'Celková částka'
</i18n>
