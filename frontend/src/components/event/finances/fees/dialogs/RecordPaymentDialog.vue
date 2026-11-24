<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :subtitle="`${name} · ${fee.reference}`"
      icon="add_card"
      @submit="submit"
      @cancel="onDialogCancel"
    >
      <div class="column no-wrap q-gutter-y-md">
        <div class="column q-gutter-y-xs">
          <amount-input
            v-model="amount"
            :currency="fee.balance.currency"
            :label="t('finance.field.amount')"
            autofocus
            large
            data-test="payment-amount"
          />
          <div
            v-if="fee.balance.outstanding > 0"
            class="text-caption text-on-surface-variant q-px-sm"
          >
            {{ t('prefillHint') }}
          </div>
        </div>

        <q-btn-toggle
          v-model="method"
          :options="methods"
          spread
          no-caps
          rounded
          unelevated
          toggle-color="primary"
          toggle-text-color="on-primary"
          color="surface-container-high"
          text-color="on-surface"
          data-test="payment-method"
        />

        <!-- Money that arrived: never a date ahead. -->
        <event-date-input
          v-model="paidOn"
          :label="t('paidOn')"
          :max="today"
          open-on-today
          data-test="payment-paid-on"
        />

        <q-input
          v-model="note"
          :label="t('finance.field.note')"
          :hint="t('noteHint')"
          maxlength="255"
          autogrow
          outlined
          rounded
          data-test="payment-note"
        />
      </div>

      <template #actions>
        <m-btn
          :label="t('finance.action.cancel')"
          text
          rounded
          color="primary"
          @click="onDialogCancel"
        />
        <m-btn
          :label="t('submit')"
          :loading="saving"
          rounded
          color="primary"
          type="submit"
          data-test="payment-submit"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  PAYMENT_METHODS,
  type PaymentMethod,
  type RegistrationFee,
} from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import AmountInput from '@/components/event/finances/AmountInput.vue';
import EventDateInput from '@/components/event/EventDateInput.vue';
import { useFeeStore } from '@/stores/fee-store';
import { formatLocalDate } from '@/utils/date';
import { feeName } from '@/utils/registrationFee';

const { fee } = defineProps<{ fee: RegistrationFee }>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { t } = useI18n();
const feeStore = useFeeStore();

const name = computed(() => feeName(fee));
const today = formatLocalDate(new Date());

// What is still open, the usual case: one transfer for the whole fee.
const amount = ref<number | null>(fee.balance.outstanding || null);
const method = ref<PaymentMethod>('BANK_TRANSFER');
const paidOn = ref<string | null>(today);
const note = ref('');
const saving = ref(false);

const methods = computed(() =>
  PAYMENT_METHODS.map((value) => ({
    value,
    label: t(`finance.fee.method.${value}`),
  })),
);

async function submit() {
  if (amount.value === null || paidOn.value === null) {
    return;
  }
  saving.value = true;
  try {
    onDialogOK(
      await feeStore.recordPayment(fee.id, {
        amount: amount.value,
        method: method.value,
        paidOn: paidOn.value,
        note: note.value.trim() || null,
      }),
    );
  } catch {
    // Reported by the store.
  } finally {
    saving.value = false;
  }
}
</script>

<i18n lang="yaml" locale="en">
title: 'Record payment'
prefillHint: 'Filled in with what is still open.'
paidOn: 'Booked on'
noteHint: 'E.g. who paid, if it was someone else'
submit: 'Record'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zahlung erfassen'
prefillHint: 'Mit dem noch offenen Betrag vorausgefüllt.'
paidOn: 'Gebucht am'
noteHint: 'Z. B. wer bezahlt hat, wenn es jemand anderes war'
submit: 'Erfassen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Enregistrer un paiement'
prefillHint: 'Prérempli avec ce qui reste à payer.'
paidOn: 'Reçu le'
noteHint: "Par ex. qui a payé, si c'était quelqu'un d'autre"
submit: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zarejestruj płatność'
prefillHint: 'Wypełnione kwotą, która pozostała do zapłaty.'
paidOn: 'Zaksięgowano'
noteHint: 'Np. kto zapłacił, jeśli była to inna osoba'
submit: 'Zarejestruj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Zaznamenat platbu'
prefillHint: 'Předvyplněno zbývající částkou.'
paidOn: 'Připsáno'
noteHint: 'Např. kdo platil, pokud to byl někdo jiný'
submit: 'Zaznamenat'
</i18n>
