<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :subtitle="
        t('subtitle', { amount: money(selected.refundable, currency) })
      "
      icon="undo"
      @submit="submit"
      @cancel="onDialogCancel"
    >
      <div class="column no-wrap q-gutter-y-md">
        <!-- Several payments: the newest first, each with what is left. -->
        <q-select
          v-if="choices.length > 1"
          v-model="selected"
          :options="choices"
          :option-label="paymentLabel"
          :label="t('payment')"
          outlined
          rounded
          data-test="refund-payment"
          @update:model-value="onSelect"
        />
        <amount-input
          v-model="amount"
          :currency
          :label="t('finance.field.amount')"
          autofocus
          large
          data-test="refund-amount"
        />
        <div
          v-if="tooMuch"
          class="text-caption text-negative q-px-sm"
        >
          {{ t('tooMuch') }}
        </div>

        <!-- Only for a fee that still belongs to a registration. -->
        <q-toggle
          v-if="selected.registrationId"
          v-model="reduceAmountDue"
          color="primary"
          data-test="refund-cancellation"
        >
          <div class="column">
            <span>{{ t('cancellation') }}</span>
            <span class="text-caption text-on-surface-variant">
              {{ reduceAmountDue ? t('cancellationOn') : t('cancellationOff') }}
            </span>
          </div>
        </q-toggle>

        <event-date-input
          v-model="refundedOn"
          :label="t('refundedOn')"
          :max="today"
          open-on-today
          data-test="refund-date"
        />

        <q-input
          v-model="reason"
          :label="t('reason')"
          maxlength="255"
          autogrow
          outlined
          rounded
          data-test="refund-reason"
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
          :disable="tooMuch"
          rounded
          color="primary"
          type="submit"
          data-test="refund-submit"
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
import type {
  Payment,
  RegistrationFee,
} from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import AmountInput from '@/components/event/finances/AmountInput.vue';
import EventDateInput from '@/components/event/EventDateInput.vue';
import { useFeeStore } from '@/stores/fee-store';
import { useFinanceFormat } from '@/composables/financeFormat';
import { formatLocalDate, parseLocalDate } from '@/utils/date';

const { payment = undefined, fee = undefined } = defineProps<{
  /** The payment to refund; without it, one of the fee's is picked. */
  payment?: Payment | undefined;
  /** Its registration's fee; absent once the registration is deleted. */
  fee?: RegistrationFee | undefined;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { t, d } = useI18n();
const { money } = useFinanceFormat();
const feeStore = useFeeStore();

// Newest first: a refund usually answers the latest payment.
const choices = computed<Payment[]>(() =>
  payment
    ? [payment]
    : (fee?.payments ?? [])
        .filter((p) => p.refundable > 0)
        .sort((a, b) => b.paidOn.localeCompare(a.paidOn)),
);
// Opened from a fee only while one of its payments is refundable.
const selected = ref<Payment>(choices.value[0] as Payment);
const currency = computed(() => selected.value.currency);
const today = formatLocalDate(new Date());
const overpaid = computed(() => fee?.balance.overpaid ?? 0);

// An excess is given back as it is; otherwise it is a cancellation.
function suggested(p: Payment): number | null {
  return Math.min(overpaid.value || p.refundable, p.refundable) || null;
}
const amount = ref<number | null>(suggested(selected.value));
const reduceAmountDue = ref(overpaid.value === 0);
const refundedOn = ref<string | null>(today);
const reason = ref('');
const saving = ref(false);

const tooMuch = computed(
  () => amount.value !== null && amount.value > selected.value.refundable,
);

function paymentLabel(p: Payment): string {
  return [
    t(`finance.fee.method.${p.method}`),
    d(parseLocalDate(p.paidOn), 'date'),
    t('left', { amount: money(p.refundable, p.currency) }),
  ].join(' · ');
}

function onSelect(p: Payment) {
  amount.value = suggested(p);
}

async function submit() {
  if (amount.value === null || refundedOn.value === null || tooMuch.value) {
    return;
  }
  saving.value = true;
  try {
    await feeStore.refundPayment(selected.value, {
      amount: amount.value,
      refundedOn: refundedOn.value,
      reason: reason.value.trim() || null,
      reduceAmountDue: reduceAmountDue.value,
    });
    onDialogOK();
  } catch {
    // Reported by the store.
  } finally {
    saving.value = false;
  }
}
</script>

<i18n lang="yaml" locale="en">
payment: 'Payment'
left: '{amount} left'
title: 'Refund'
subtitle: 'Up to {amount} of this payment'
tooMuch: 'More than is left of this payment.'
cancellation: 'Cancellation'
cancellationOn: 'They owe less: the refund comes off the amount due.'
cancellationOff: 'They still owe as much: only an excess goes back.'
refundedOn: 'Sent back on'
reason: 'Reason (optional)'
submit: 'Record refund'
</i18n>

<i18n lang="yaml" locale="de">
payment: 'Zahlung'
left: 'noch {amount}'
title: 'Erstatten'
subtitle: 'Bis zu {amount} dieser Zahlung'
tooMuch: 'Mehr als von dieser Zahlung übrig ist.'
cancellation: 'Stornierung'
cancellationOn: 'Es ist weniger fällig: Die Erstattung wird vom Betrag abgezogen.'
cancellationOff: 'Es bleibt gleich viel fällig: Nur zu viel Gezahltes geht zurück.'
refundedOn: 'Zurückgezahlt am'
reason: 'Grund (optional)'
submit: 'Erstattung erfassen'
</i18n>

<i18n lang="yaml" locale="fr">
payment: 'Paiement'
left: '{amount} restants'
title: 'Rembourser'
subtitle: "Jusqu'à {amount} de ce paiement"
tooMuch: 'Plus que ce qui reste de ce paiement.'
cancellation: 'Annulation'
cancellationOn: 'Le montant dû baisse du montant remboursé.'
cancellationOff: "Le montant dû reste le même : seul l'excédent est rendu."
refundedOn: 'Rendu le'
reason: 'Motif (facultatif)'
submit: 'Enregistrer le remboursement'
</i18n>

<i18n lang="yaml" locale="pl">
payment: 'Płatność'
left: 'pozostało {amount}'
title: 'Zwróć'
subtitle: 'Do {amount} z tej płatności'
tooMuch: 'Więcej niż pozostało z tej płatności.'
cancellation: 'Rezygnacja'
cancellationOn: 'Kwota należna zmniejsza się o zwrot.'
cancellationOff: 'Kwota należna pozostaje: zwracana jest tylko nadpłata.'
refundedOn: 'Zwrócono'
reason: 'Powód (opcjonalnie)'
submit: 'Zarejestruj zwrot'
</i18n>

<i18n lang="yaml" locale="cs">
payment: 'Platba'
left: 'zbývá {amount}'
title: 'Vrátit'
subtitle: 'Až {amount} z této platby'
tooMuch: 'Víc, než z této platby zbývá.'
cancellation: 'Storno'
cancellationOn: 'Dlužná částka se sníží o vrácenou částku.'
cancellationOff: 'Dlužná částka zůstává: vrací se jen přeplatek.'
refundedOn: 'Vráceno dne'
reason: 'Důvod (nepovinné)'
submit: 'Zaznamenat vrácení'
</i18n>
