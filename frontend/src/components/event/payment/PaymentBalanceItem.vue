<template>
  <q-item
    class="segment"
    data-test="payment-balance"
  >
    <q-item-section avatar>
      <div class="row-icon">
        <q-icon
          name="payments"
          size="20px"
        />
      </div>
    </q-item-section>
    <q-item-section>
      <q-item-label class="row-label">
        {{ payment.amountDue === null ? t('paid') : t('due') }}
      </q-item-label>
      <q-item-label class="row-value balance-value">
        {{ money(payment.amountDue ?? payment.amountPaid) }}
      </q-item-label>
      <!-- Paid and open as labelled amounts, never "x of y". -->
      <template v-if="payment.amountDue">
        <q-linear-progress
          :value="paidShare"
          color="primary"
          track-color="surface-container-highest"
          size="6px"
          rounded
          class="q-mt-sm"
          :aria-label="t('paidShare')"
        />
        <div
          class="balance-figures row justify-between no-wrap q-mt-xs"
          data-test="payment-figures"
        >
          <span>
            {{ t('paid') }}
            <strong>{{ money(payment.amountPaid) }}</strong>
          </span>
          <span
            v-if="payment.overpaid > 0"
            class="balance-figures__overpaid"
          >
            {{ t('overpaid') }}
            <strong>{{ money(payment.overpaid) }}</strong>
          </span>
          <span v-else-if="payment.outstanding > 0">
            {{ t('open') }}
            <strong>{{ money(payment.outstanding) }}</strong>
          </span>
        </div>
      </template>
      <q-item-label
        v-if="payment.overpaid > 0"
        class="row-caption row-caption--warning"
        data-test="payment-overpaid"
      >
        {{ t('overpaidHint') }}
        <a
          v-if="canRefundOverpaid"
          class="inline-action"
          href="#"
          data-test="payment-refund-overpaid"
          @click.prevent="emit('refundOverpaid')"
        >
          {{ t('refund') }}
        </a>
      </q-item-label>
      <q-item-label
        v-if="payment.adjustment"
        class="row-caption"
        data-test="payment-adjustment"
      >
        {{ t('adjusted') }}
        <template v-if="payment.adjustment.note">
          · {{ payment.adjustment.note }}
        </template>
        <template v-if="payment.quotedAmount !== null">
          · {{ t('quoted', { amount: money(payment.quotedAmount) }) }}
        </template>
      </q-item-label>
      <q-item-label
        v-if="answersAmount !== null"
        class="row-caption row-caption--warning"
        data-test="payment-answers-differ"
      >
        {{ t('answersDiffer', { amount: money(answersAmount) }) }}
        <a
          v-if="canAdjust"
          class="inline-action"
          href="#"
          data-test="payment-adjust-to-answers"
          @click.prevent="emit('adjust', answersAmount)"
        >
          {{ t('adjust') }}
        </a>
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <div class="row items-center no-wrap q-gutter-x-xs">
        <payment-status-chip :status="payment.status" />
        <q-btn
          v-if="actions.length > 0"
          class="row-action"
          flat
          round
          size="sm"
          icon="more_vert"
          :aria-label="t('more')"
          data-test="payment-menu"
        >
          <q-menu>
            <q-list style="min-width: 220px">
              <q-item
                v-for="action in actions"
                :key="action.key"
                v-close-popup
                clickable
                :data-test="`payment-${action.key}`"
                @click="action.run"
              >
                <q-item-section avatar>
                  <q-icon :name="action.icon" />
                </q-item-section>
                <q-item-section>{{ action.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RegistrationPaymentDetails } from '@camp-registration/common/entities';
import { formatMoney } from '@camp-registration/common/utils';
import PaymentStatusChip from '@/components/event/payment/PaymentStatusChip.vue';
import type { BalanceAction } from '@/components/event/payment/types';

const { payment, answersAmount = null } = defineProps<{
  payment: RegistrationPaymentDetails;
  /** Minor units the answers come to now, when that differs from what is owed. */
  answersAmount?: number | null;
  canAdjust: boolean;
  canRefundOverpaid: boolean;
  actions: BalanceAction[];
}>();

const emit = defineEmits<{
  refundOverpaid: [];
  adjust: [amount: number];
}>();

const { t, locale } = useI18n();

const paidShare = computed<number>(() => {
  const due = payment.amountDue ?? 0;
  return due > 0 ? Math.min(1, payment.amountPaid / due) : 0;
});

function money(minor: number): string {
  return formatMoney(minor, payment.currency, locale.value);
}
</script>

<i18n lang="yaml" locale="en">
open: 'Open'
due: 'Due'
paid: 'Paid'
overpaid: 'Overpaid'
overpaidHint: 'More arrived than is due.'
paidShare: 'Share paid'
adjusted: 'Set by hand'
quoted: 'Shown at registration: {amount}'
answersDiffer: 'The answers now come to {amount}.'
refund: 'Refund'
adjust: 'Change amount'
more: 'More payment actions'
</i18n>

<i18n lang="yaml" locale="de">
open: 'Offen'
due: 'Fällig'
paid: 'Bezahlt'
overpaid: 'Überzahlt'
overpaidHint: 'Es ist mehr eingegangen als fällig.'
paidShare: 'Bezahlter Anteil'
adjusted: 'Von Hand festgelegt'
quoted: 'Bei der Anmeldung angezeigt: {amount}'
answersDiffer: 'Die Antworten ergeben jetzt {amount}.'
refund: 'Erstatten'
adjust: 'Betrag ändern'
more: 'Weitere Zahlungsaktionen'
</i18n>

<i18n lang="yaml" locale="fr">
open: 'À payer'
due: 'Montant dû'
paid: 'Payé'
overpaid: 'Trop-perçu'
overpaidHint: 'Plus que le montant dû a été reçu.'
paidShare: 'Part payée'
adjusted: 'Défini manuellement'
quoted: "Affiché à l'inscription : {amount}"
answersDiffer: 'Les réponses donnent maintenant {amount}.'
refund: 'Rembourser'
adjust: 'Modifier le montant'
more: 'Autres actions de paiement'
</i18n>

<i18n lang="yaml" locale="pl">
open: 'Do zapłaty'
due: 'Do zapłaty'
paid: 'Zapłacono'
overpaid: 'Nadpłata'
overpaidHint: 'Wpłynęło więcej, niż wynosi należność.'
paidShare: 'Zapłacona część'
adjusted: 'Ustawione ręcznie'
quoted: 'Pokazane przy rejestracji: {amount}'
answersDiffer: 'Odpowiedzi dają teraz {amount}.'
refund: 'Zwróć'
adjust: 'Zmień kwotę'
more: 'Więcej działań płatności'
</i18n>

<i18n lang="yaml" locale="cs">
open: 'Nezaplaceno'
due: 'Splatné'
paid: 'Zaplaceno'
overpaid: 'Přeplaceno'
overpaidHint: 'Přišlo víc, než je splatné.'
paidShare: 'Zaplacený podíl'
adjusted: 'Nastaveno ručně'
quoted: 'Zobrazeno při registraci: {amount}'
answersDiffer: 'Odpovědi teď dávají {amount}.'
refund: 'Vrátit'
adjust: 'Změnit částku'
more: 'Další akce plateb'
</i18n>

<style scoped lang="scss">
@use '../../../css/segmented-list';

.balance-value {
  font-size: 1.125rem;
  font-weight: 600;
}

.balance-figures {
  gap: 12px;
  font-size: 0.8125rem;
  color: var(--md3-on-surface-variant);
}

.balance-figures strong {
  color: var(--md3-on-surface);
  font-variant-numeric: tabular-nums;
}

.balance-figures__overpaid,
.balance-figures__overpaid strong {
  color: var(--md3-tertiary);
}

.row-caption--warning {
  color: var(--md3-on-surface);
}

.inline-action {
  margin-left: 4px;
  font-weight: 500;
  color: var(--md3-primary);
  text-decoration: none;
}
</style>
