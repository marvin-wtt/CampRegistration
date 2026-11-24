<template>
  <!-- A registration's fee at a glance; the fee dialog does the rest. -->
  <section
    v-if="can('event.payments.view') && fee"
    data-test="registration-fee"
  >
    <div class="section-title">{{ t('title') }}</div>
    <q-list>
      <q-item
        clickable
        class="fee-item"
        @click="dialogs.details(fee)"
      >
        <q-item-section avatar>
          <q-icon
            name="payments"
            color="primary"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label class="row items-center q-gutter-x-sm no-wrap">
            <span class="text-amount">{{ summary }}</span>
            <payment-status-chip :status="fee.balance.status" />
          </q-item-label>
          <q-item-label caption>
            {{ t('reference') }} {{ fee.reference }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>
  </section>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import PaymentStatusChip from '@/components/event/finances/fees/PaymentStatusChip.vue';
import { useFeeDialogs } from '@/composables/feeDialogs';
import { useFinanceFormat } from '@/composables/financeFormat';
import { usePermissions } from '@/composables/permissions';
import { useFeeStore } from '@/stores/fee-store';

const { registrationId } = defineProps<{ registrationId: string }>();

const { t } = useI18n();
const { money } = useFinanceFormat();
const { can } = usePermissions();
const feeStore = useFeeStore();
const dialogs = useFeeDialogs();

// Only those who may see fees ask for them.
watch(
  () => can('event.payments.view'),
  (allowed) => {
    if (allowed) {
      void feeStore.fetchData();
    }
  },
  { immediate: true },
);

const fee = computed(() => feeStore.byId.get(registrationId));

const summary = computed(() => {
  if (!fee.value) {
    return '';
  }
  const { amountPaid, amountDue, currency } = fee.value.balance;
  return amountDue === null
    ? money(amountPaid, currency)
    : t('paidOf', {
        paid: money(amountPaid, currency),
        due: money(amountDue, currency),
      });
});
</script>

<style scoped>
/* As the registration dialog titles its other sections. */
.section-title {
  padding: 0 4px 8px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--md3-primary);
}

.fee-item {
  border-radius: 16px;
  background-color: var(--md3-surface-container-high);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Fee'
paidOf: '{paid} of {due} paid'
reference: 'Reference'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Beitrag'
paidOf: '{paid} von {due} bezahlt'
reference: 'Verwendungszweck'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Frais'
paidOf: '{paid} payés sur {due}'
reference: 'Référence'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Opłata'
paidOf: 'Zapłacono {paid} z {due}'
reference: 'Tytuł przelewu'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Poplatek'
paidOf: 'Zaplaceno {paid} z {due}'
reference: 'Reference'
</i18n>
