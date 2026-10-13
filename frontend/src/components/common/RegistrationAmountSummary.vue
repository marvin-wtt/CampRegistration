<template>
  <div
    v-if="model.lastPage && model.amount > 0"
    class="amount-summary row items-center no-wrap rounded-lg"
    data-test="registration-amount-summary"
  >
    <span class="col text-body1">{{ t('total') }}</span>
    <span class="amount text-h6">{{ formattedAmount }}</span>
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
  gap: 16px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background-color: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
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
