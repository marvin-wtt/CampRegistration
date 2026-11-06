<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      class="rounded-xl"
      style="width: min(460px, 95vw)"
    >
      <q-form @submit="submit">
        <q-card-section>
          <div class="text-h6">{{ t('title') }}</div>
          <div class="text-body2 text-on-surface-variant q-mt-xs">
            {{
              t('hint', {
                refundable: formatMoney(refundable, currency, locale),
              })
            }}
          </div>
        </q-card-section>

        <q-card-section class="column q-gutter-md">
          <q-input
            v-model.number="amount"
            :label="t('field.amount')"
            :suffix="currencySymbol(currency, locale)"
            :rules="[
              (val: number) => (!!val && val > 0) || t('validation.positive'),
              (val: number) =>
                toMinorUnits(val, currency) <= refundable ||
                t('validation.max'),
            ]"
            type="number"
            step="0.01"
            min="0"
            input-class="text-right"
            outlined
            rounded
            autofocus
            data-test="refund-amount"
          />
          <q-input
            v-model="reason"
            :label="t('field.reason')"
            :hint="t('field.reasonHint')"
            maxlength="500"
            outlined
            rounded
          />
          <!-- An online payment can also have been settled in person. -->
          <q-option-group
            v-if="!manual"
            v-model="route"
            :options="routeOptions"
            data-test="refund-route"
          />
          <!-- A refund usually lowers the price (late arrival, goodwill);
               otherwise the registration would owe it again. Returning an
               overpayment lowers nothing: that money was never owed. -->
          <q-checkbox
            v-if="lowersBy > 0"
            v-model="reduceAmountDue"
            :label="
              overpaid > 0
                ? t('field.reduceAmountDueBy', {
                    amount: formatMoney(lowersBy, currency, locale),
                  })
                : t('field.reduceAmountDue')
            "
            data-test="refund-reduce-amount-due"
          />
          <div
            v-if="overpaid > 0"
            class="text-body2 text-on-surface-variant"
            data-test="refund-overpaid-hint"
          >
            {{
              t('overpaid', {
                amount: formatMoney(overpaid, currency, locale),
              })
            }}
          </div>
          <q-checkbox
            v-model="notify"
            :label="t('field.notify')"
          />
          <q-banner
            v-if="!manual && route === 'provider'"
            dense
            rounded
            class="bg-warning-container text-on-warning-container text-body2"
          >
            <template #avatar>
              <q-icon name="warning" />
            </template>
            {{ t('warning') }}
          </q-banner>
        </q-card-section>

        <q-card-actions align="right">
          <m-btn
            text
            :label="t('action.cancel')"
            @click="onDialogCancel"
          />
          <m-btn
            type="submit"
            error
            icon="undo"
            :label="t('action.refund')"
            data-test="refund-submit"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { PaymentRefundCreateData } from '@camp-registration/common/entities';
import {
  currencySymbol,
  formatMoney,
  fromMinorUnits,
  toMinorUnits,
} from '@camp-registration/common/utils';

const {
  currency,
  refundable,
  overpaid = 0,
  manual,
} = defineProps<{
  currency: string;
  /** Minor units still refundable on this payment. */
  refundable: number;
  /** Minor units the registration paid beyond its amount due. */
  overpaid?: number;
  /** Manual payments are only recorded as refunded; no money moves here. */
  manual: boolean;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t, locale } = useI18n();

// An overpayment is the likely reason to refund, so it is the suggestion.
const amount = ref<number>(
  fromMinorUnits(
    overpaid > 0 ? Math.min(overpaid, refundable) : refundable,
    currency,
  ),
);

// The part beyond the overpayment, which the amount due can drop by.
const lowersBy = computed<number>(() =>
  Math.max(0, toMinorUnits(amount.value || 0, currency) - overpaid),
);
const route = ref<'provider' | 'outside'>('provider');
const routeOptions = computed(() => [
  { value: 'provider', label: t('route.provider') },
  { value: 'outside', label: t('route.outside') },
]);
const reason = ref<string>('');
const notify = ref<boolean>(true);
const reduceAmountDue = ref<boolean>(true);

function submit(): void {
  onDialogOK({
    amount: toMinorUnits(amount.value, currency),
    reason: reason.value.trim() || null,
    suppressMessage: !notify.value,
    outsideApp: !manual && route.value === 'outside',
    reduceAmountDue: lowersBy.value > 0 && reduceAmountDue.value,
  } satisfies PaymentRefundCreateData);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Refund payment'
hint: 'Up to {refundable} can be refunded.'
overpaid: '{amount} was paid beyond what is due; giving that back leaves the amount due as it is.'
field:
  reduceAmountDue: 'Also lower the amount due by this refund'
  reduceAmountDueBy: 'Also lower the amount due by {amount}'
  amount: 'Amount to refund'
  reason: 'Reason'
  reasonHint: 'Included in the email to the participant'
  notify: 'Email the participant once the refund is completed'
validation:
  positive: 'Enter an amount greater than zero'
  max: 'That is more than can be refunded'
route:
  provider: 'Refund through the payment provider'
  outside: 'Already given back outside the app (cash, bank transfer)'
warning: 'The refund is sent to the payment provider right away and cannot be undone.'
action:
  cancel: 'Cancel'
  refund: 'Refund'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zahlung erstatten'
hint: 'Es können bis zu {refundable} erstattet werden.'
overpaid: '{amount} wurden über den fälligen Betrag hinaus gezahlt; deren Erstattung ändert den fälligen Betrag nicht.'
field:
  reduceAmountDue: 'Fälligen Betrag um diese Erstattung senken'
  reduceAmountDueBy: 'Fälligen Betrag um {amount} senken'
  amount: 'Zu erstattender Betrag'
  reason: 'Grund'
  reasonHint: 'Wird in die E-Mail an die teilnehmende Person übernommen'
  notify: 'Teilnehmende Person nach abgeschlossener Erstattung per E-Mail benachrichtigen'
validation:
  positive: 'Gib einen Betrag größer als null ein'
  max: 'Das ist mehr, als erstattet werden kann'
route:
  provider: 'Über den Zahlungsanbieter erstatten'
  outside: 'Bereits außerhalb der App erstattet (bar, Überweisung)'
warning: 'Die Erstattung wird sofort an den Zahlungsanbieter übermittelt und kann nicht rückgängig gemacht werden.'
action:
  cancel: 'Abbrechen'
  refund: 'Erstatten'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Rembourser le paiement'
hint: "Jusqu'à {refundable} peuvent être remboursés."
overpaid: '{amount} ont été payés au-delà du montant dû ; les rembourser ne change pas le montant dû.'
field:
  reduceAmountDue: 'Réduire aussi le montant dû de ce remboursement'
  reduceAmountDueBy: 'Réduire aussi le montant dû de {amount}'
  amount: 'Montant à rembourser'
  reason: 'Motif'
  reasonHint: "Repris dans l'e-mail envoyé au participant"
  notify: 'Envoyer un e-mail au participant une fois le remboursement effectué'
validation:
  positive: 'Saisissez un montant supérieur à zéro'
  max: 'Ce montant dépasse ce qui peut être remboursé'
route:
  provider: 'Rembourser via le prestataire de paiement'
  outside: "Déjà remboursé en dehors de l'application (espèces, virement)"
warning: 'Le remboursement est transmis immédiatement au prestataire de paiement et ne peut pas être annulé.'
action:
  cancel: 'Annuler'
  refund: 'Rembourser'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zwróć płatność'
hint: 'Można zwrócić maksymalnie {refundable}.'
overpaid: '{amount} wpłacono ponad należność; zwrot tej części nie zmienia kwoty do zapłaty.'
field:
  reduceAmountDue: 'Obniż też kwotę do zapłaty o ten zwrot'
  reduceAmountDueBy: 'Obniż też kwotę do zapłaty o {amount}'
  amount: 'Kwota zwrotu'
  reason: 'Powód'
  reasonHint: 'Zostanie dołączony do e-maila do uczestnika'
  notify: 'Wyślij uczestnikowi e-mail po zakończeniu zwrotu'
validation:
  positive: 'Wpisz kwotę większą od zera'
  max: 'To więcej, niż można zwrócić'
route:
  provider: 'Zwrot przez operatora płatności'
  outside: 'Zwrócono już poza aplikacją (gotówka, przelew)'
warning: 'Zwrot zostanie od razu przekazany operatorowi płatności i nie można go cofnąć.'
action:
  cancel: 'Anuluj'
  refund: 'Zwróć'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vrátit platbu'
hint: 'Vrátit lze nejvýše {refundable}.'
overpaid: '{amount} bylo zaplaceno nad rámec dlužné částky; jejich vrácení dlužnou částku nemění.'
field:
  reduceAmountDue: 'Snížit také dlužnou částku o toto vrácení'
  reduceAmountDueBy: 'Snížit také dlužnou částku o {amount}'
  amount: 'Částka k vrácení'
  reason: 'Důvod'
  reasonHint: 'Bude uveden v e-mailu účastníkovi'
  notify: 'Po dokončení vrácení poslat účastníkovi e-mail'
validation:
  positive: 'Zadejte částku větší než nula'
  max: 'To je víc, než lze vrátit'
route:
  provider: 'Vrátit přes platebního poskytovatele'
  outside: 'Již vráceno mimo aplikaci (hotově, převodem)'
warning: 'Vrácení se ihned odešle platebnímu poskytovateli a nelze ho vzít zpět.'
action:
  cancel: 'Zrušit'
  refund: 'Vrátit'
</i18n>
