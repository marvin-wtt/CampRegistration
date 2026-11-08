<template>
  <div
    class="column q-gutter-y-sm"
    data-test="registration-delete-settlement"
  >
    <q-banner
      dense
      rounded
      class="bg-warning-container text-on-warning-container text-body2"
      data-test="registration-delete-paid-warning"
    >
      <template #avatar>
        <q-icon name="payments" />
      </template>
      {{
        t(maySettle ? 'paidWarning' : 'noPermission', { amount: paidAmount })
      }}
      <template
        v-if="maySettle"
        #action
      >
        <q-btn
          :label="t('refundFirst')"
          color="primary"
          rounded
          flat
          no-caps
          data-test="registration-delete-refund-first"
          @click="emit('refundFirst')"
        />
      </template>
    </q-banner>
    <q-option-group
      v-if="maySettle"
      v-model="settlement"
      :options="settlementOptions"
      data-test="registration-delete-settlement-options"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  PAYMENT_SETTLEMENTS,
  type PaymentSettlement,
  type RegistrationPaymentDetails,
} from '@camp-registration/common/entities';
import { formatMoney } from '@camp-registration/common/utils';
import { usePermissions } from '@/composables/permissions';

/**
 * How the money a registration still holds is settled before it is deleted.
 * Keeping it or booking it back is a refund decision, so only someone who
 * may refund chooses; anyone else is told why the deletion waits.
 */
const { balance } = defineProps<{
  balance: RegistrationPaymentDetails;
}>();

const settlement = defineModel<PaymentSettlement | null>({ required: true });

const emit = defineEmits<{
  refundFirst: [];
}>();

const { t, locale } = useI18n();
const { can } = usePermissions();

const maySettle = computed<boolean>(() => can('event.payments.refund'));

const paidAmount = computed<string>(() =>
  formatMoney(balance.amountPaid, balance.currency, locale.value),
);

const settlementOptions = computed(() =>
  PAYMENT_SETTLEMENTS.map((value) => ({
    value,
    label: t(`settlement.${value}`),
  })),
);
</script>

<i18n locale="en" lang="yaml">
paidWarning: 'This person still has {amount} paid. The payments stay on record either way; choose how the money is settled, or refund it first.'
noPermission: 'This person still has {amount} paid. Only someone who may give refunds can settle it before the registration is deleted.'
settlement:
  retained: 'Keep the money (e.g. as a cancellation fee)'
  settled_outside: 'Already given back outside the app (cash, bank transfer)'
refundFirst: 'Refund first'
</i18n>

<i18n locale="de" lang="yaml">
paidWarning: 'Diese Person hat noch {amount} bezahlt. Die Zahlungen bleiben in jedem Fall erhalten; wähle, wie das Geld abgerechnet wird, oder erstatte es zuerst.'
noPermission: 'Diese Person hat noch {amount} bezahlt. Nur wer erstatten darf, kann das Geld vor dem Löschen der Anmeldung abrechnen.'
settlement:
  retained: 'Geld behalten (z. B. als Stornogebühr)'
  settled_outside: 'Bereits außerhalb der App erstattet (bar, Überweisung)'
refundFirst: 'Zuerst erstatten'
</i18n>

<i18n locale="fr" lang="yaml">
paidWarning: "Cette personne a encore {amount} payés. Les paiements restent enregistrés dans tous les cas ; choisissez comment l'argent est réglé, ou remboursez-le d'abord."
noPermission: "Cette personne a encore {amount} payés. Seule une personne autorisée à rembourser peut régler cet argent avant la suppression de l'inscription."
settlement:
  retained: "Garder l'argent (p. ex. comme frais d'annulation)"
  settled_outside: "Déjà remboursé en dehors de l'application (espèces, virement)"
refundFirst: "Rembourser d'abord"
</i18n>

<i18n locale="pl" lang="yaml">
paidWarning: 'Ta osoba ma jeszcze zapłacone {amount}. Płatności zostaną zachowane w każdym przypadku; wybierz, jak rozliczyć pieniądze, albo najpierw dokonaj zwrotu.'
noPermission: 'Ta osoba ma jeszcze zapłacone {amount}. Tylko osoba uprawniona do zwrotów może rozliczyć te pieniądze przed usunięciem rejestracji.'
settlement:
  retained: 'Zatrzymaj pieniądze (np. jako opłatę za anulowanie)'
  settled_outside: 'Zwrócono już poza aplikacją (gotówka, przelew)'
refundFirst: 'Najpierw zwrot'
</i18n>

<i18n locale="cs" lang="yaml">
paidWarning: 'Tato osoba má stále zaplaceno {amount}. Platby zůstanou v každém případě zachovány; vyber, jak se peníze vypořádají, nebo je nejprve vrať.'
noPermission: 'Tato osoba má stále zaplaceno {amount}. Před smazáním registrace je může vypořádat jen ten, kdo smí vracet platby.'
settlement:
  retained: 'Ponechat peníze (např. jako storno poplatek)'
  settled_outside: 'Již vráceno mimo aplikaci (hotově, převodem)'
refundFirst: 'Nejprve vrátit'
</i18n>
