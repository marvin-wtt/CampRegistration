<template>
  <q-item
    class="segment"
    :data-test="`payment-${payment.id}`"
  >
    <q-item-section avatar>
      <div
        class="row-icon"
        :class="{ 'row-icon--muted': payment.status !== 'PAID' }"
      >
        <q-icon
          :name="icon"
          size="20px"
        />
      </div>
    </q-item-section>
    <q-item-section>
      <q-item-label class="row-label">
        {{ description }}
      </q-item-label>
      <q-item-label class="row-value">
        {{ money(payment.amount) }}
        <span
          v-if="payment.status !== 'PAID'"
          class="row-value--muted"
        >
          · {{ t(`status.${payment.status}`) }}
        </span>
      </q-item-label>
      <q-item-label
        v-if="payment.note"
        class="row-caption"
      >
        {{ payment.note }}
      </q-item-label>
      <q-item-label
        v-for="refund in payment.refunds"
        :key="refund.id"
        class="row-caption row items-center no-wrap"
        :data-test="`payment-refund-${refund.kind.toLowerCase()}`"
      >
        <q-icon
          :name="refund.kind === 'CHARGEBACK' ? 'gavel' : 'undo'"
          size="14px"
          class="q-mr-xs"
        />
        <span>
          {{
            t(
              refund.kind === 'CHARGEBACK' ? 'chargeback.line' : 'refund.line',
              {
                amount: money(refund.amount),
                status: t(`${refundStatusKey(refund)}.${refund.status}`),
              },
            )
          }}
          <template v-if="refund.reason"> · {{ refund.reason }}</template>
        </span>
      </q-item-label>
    </q-item-section>
    <q-item-section
      v-if="canRefund || canDelete"
      side
    >
      <q-btn
        class="row-action"
        flat
        round
        size="sm"
        icon="more_vert"
        :aria-label="t('action.menu')"
      >
        <q-menu>
          <q-list style="min-width: 180px">
            <q-item
              v-if="canRefund"
              v-close-popup
              clickable
              data-test="payment-refund"
              @click="emit('refund')"
            >
              <q-item-section avatar>
                <q-icon name="undo" />
              </q-item-section>
              <q-item-section>{{ t('action.refund') }}</q-item-section>
            </q-item>
            <q-item
              v-if="canDelete"
              v-close-popup
              clickable
              @click="emit('remove')"
            >
              <q-item-section avatar>
                <q-icon name="delete" />
              </q-item-section>
              <q-item-section>{{ t('action.delete') }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  Payment,
  PaymentRefund,
} from '@camp-registration/common/entities';
import { formatMoney } from '@camp-registration/common/utils';

const { payment } = defineProps<{
  payment: Payment;
  canRefund: boolean;
  canDelete: boolean;
}>();

const emit = defineEmits<{
  refund: [];
  remove: [];
}>();

const { t, d, locale } = useI18n();

function money(minor: number): string {
  return formatMoney(minor, payment.currency, locale.value);
}

function refundStatusKey(refund: PaymentRefund): string {
  return refund.kind === 'CHARGEBACK' ? 'chargebackStatus' : 'refundStatus';
}

const icon = computed<string>(() => {
  if (payment.source !== 'manual') {
    return 'credit_card';
  }
  switch (payment.method) {
    case 'bank_transfer':
      return 'account_balance';
    case 'cash':
      return 'payments';
    default:
      return 'edit_note';
  }
});

const description = computed<string>(() => {
  const parts = [
    payment.source === 'manual' && payment.method
      ? t(`method.${payment.method}`)
      : t(`source.${payment.source}`),
    d(payment.paidAt ?? payment.createdAt, 'date'),
  ];
  if (payment.createdBy) {
    parts.push(payment.createdBy);
  }

  return parts.join(' · ');
});
</script>

<i18n lang="yaml" locale="en">
status:
  OPEN: 'Checkout open'
  PENDING: 'Processing'
  PAID: 'Paid'
  FAILED: 'Failed'
  CANCELED: 'Canceled'
  EXPIRED: 'Expired'
refundStatus:
  PENDING: 'pending'
  REFUNDED: 'refunded'
  FAILED: 'failed'
  CANCELED: 'canceled'
refund:
  line: '{amount} refund {status}'
chargebackStatus:
  PENDING: 'disputed'
  REFUNDED: 'lost'
  FAILED: 'reversed'
  CANCELED: 'reversed'
chargeback:
  line: '{amount} chargeback by the bank, {status}'
source:
  manual: 'Recorded manually'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Fake provider'
method:
  bank_transfer: 'Bank transfer'
  cash: 'Cash'
  other: 'Other'
action:
  menu: 'Payment actions'
  refund: 'Refund'
  delete: 'Delete'
</i18n>

<i18n lang="yaml" locale="de">
status:
  OPEN: 'Zahlung offen'
  PENDING: 'In Bearbeitung'
  PAID: 'Bezahlt'
  FAILED: 'Fehlgeschlagen'
  CANCELED: 'Abgebrochen'
  EXPIRED: 'Abgelaufen'
refundStatus:
  PENDING: 'ausstehend'
  REFUNDED: 'erstattet'
  FAILED: 'fehlgeschlagen'
  CANCELED: 'abgebrochen'
refund:
  line: 'Erstattung {amount} {status}'
chargebackStatus:
  PENDING: 'angefochten'
  REFUNDED: 'verloren'
  FAILED: 'zurückgebucht'
  CANCELED: 'zurückgebucht'
chargeback:
  line: 'Rückbuchung der Bank {amount}, {status}'
source:
  manual: 'Manuell erfasst'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Test-Anbieter'
method:
  bank_transfer: 'Überweisung'
  cash: 'Bar'
  other: 'Sonstige'
action:
  menu: 'Zahlungsaktionen'
  refund: 'Erstatten'
  delete: 'Löschen'
</i18n>

<i18n lang="yaml" locale="fr">
status:
  OPEN: 'Paiement ouvert'
  PENDING: 'En cours'
  PAID: 'Payé'
  FAILED: 'Échoué'
  CANCELED: 'Annulé'
  EXPIRED: 'Expiré'
refundStatus:
  PENDING: 'en attente'
  REFUNDED: 'remboursé'
  FAILED: 'échoué'
  CANCELED: 'annulé'
refund:
  line: 'Remboursement de {amount} {status}'
chargebackStatus:
  PENDING: 'contestée'
  REFUNDED: 'perdue'
  FAILED: 'annulée'
  CANCELED: 'annulée'
chargeback:
  line: 'Rétrofacturation de {amount} par la banque, {status}'
source:
  manual: 'Enregistré manuellement'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Prestataire de test'
method:
  bank_transfer: 'Virement bancaire'
  cash: 'Espèces'
  other: 'Autre'
action:
  menu: 'Actions de paiement'
  refund: 'Rembourser'
  delete: 'Supprimer'
</i18n>

<i18n lang="yaml" locale="pl">
status:
  OPEN: 'Płatność otwarta'
  PENDING: 'W toku'
  PAID: 'Opłacone'
  FAILED: 'Nieudane'
  CANCELED: 'Anulowane'
  EXPIRED: 'Wygasłe'
refundStatus:
  PENDING: 'oczekuje'
  REFUNDED: 'zwrócono'
  FAILED: 'nieudany'
  CANCELED: 'anulowany'
refund:
  line: 'Zwrot {amount} {status}'
chargebackStatus:
  PENDING: 'sporny'
  REFUNDED: 'przegrany'
  FAILED: 'cofnięty'
  CANCELED: 'cofnięty'
chargeback:
  line: 'Obciążenie zwrotne przez bank {amount}, {status}'
source:
  manual: 'Zarejestrowano ręcznie'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Operator testowy'
method:
  bank_transfer: 'Przelew bankowy'
  cash: 'Gotówka'
  other: 'Inna'
action:
  menu: 'Akcje płatności'
  refund: 'Zwróć'
  delete: 'Usuń'
</i18n>

<i18n lang="yaml" locale="cs">
status:
  OPEN: 'Platba otevřená'
  PENDING: 'Zpracovává se'
  PAID: 'Zaplaceno'
  FAILED: 'Neúspěšná'
  CANCELED: 'Zrušená'
  EXPIRED: 'Vypršela'
refundStatus:
  PENDING: 'čeká'
  REFUNDED: 'vráceno'
  FAILED: 'neúspěšné'
  CANCELED: 'zrušeno'
refund:
  line: 'Vrácení {amount} {status}'
chargebackStatus:
  PENDING: 'sporná'
  REFUNDED: 'prohraná'
  FAILED: 'zrušená'
  CANCELED: 'zrušená'
chargeback:
  line: 'Zpětné zúčtování bankou {amount}, {status}'
source:
  manual: 'Zaznamenáno ručně'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Testovací poskytovatel'
method:
  bank_transfer: 'Bankovní převod'
  cash: 'Hotovost'
  other: 'Jiné'
action:
  menu: 'Akce platby'
  refund: 'Vrátit'
  delete: 'Smazat'
</i18n>

<style scoped lang="scss">
@use '../../../css/segmented-list';

.row-value--muted {
  color: var(--md3-on-surface-variant);
}

.row-icon--muted {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}
</style>
