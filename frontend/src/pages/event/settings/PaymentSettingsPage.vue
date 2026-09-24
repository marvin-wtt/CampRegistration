<template>
  <q-page
    padding
    class="payment-settings-page row justify-center"
  >
    <div class="col-12 col-sm-10 col-md-8 col-lg-6 column q-gutter-y-lg">
      <div class="page-title">
        <div class="text-h5 text-weight-medium">
          {{ t('title') }}
        </div>
        <div class="text-body2 text-on-surface-variant q-mt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <q-banner
        v-if="status && !status.account"
        rounded
        class="bg-warning-container text-on-warning-container"
        data-test="payment-settings-no-account"
      >
        <template #avatar>
          <q-icon name="account_balance" />
        </template>
        {{ t('warning.noAccount') }}
      </q-banner>
      <q-banner
        v-else-if="status && !status.organizationVerified"
        rounded
        class="bg-warning-container text-on-warning-container"
      >
        <template #avatar>
          <q-icon name="pending" />
        </template>
        {{ t('warning.unverified') }}
      </q-banner>
      <q-banner
        v-else-if="status?.account?.mode === 'test'"
        rounded
        class="bg-info-container text-on-info-container"
      >
        <template #avatar>
          <q-icon name="science" />
        </template>
        {{ t('warning.testMode') }}
      </q-banner>

      <q-list
        bordered
        separator
        class="rounded-borders overflow-hidden"
      >
        <q-item
          tag="label"
          class="q-py-md"
        >
          <q-item-section avatar>
            <q-icon
              name="payments"
              color="grey-7"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ t('enabled.label') }}
            </q-item-label>
            <q-item-label caption>
              {{ t('enabled.description') }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle
              v-model="settings.enabled"
              :disable="isLoading"
              data-test="payment-settings-enabled"
            />
          </q-item-section>
        </q-item>

        <template v-if="settings.enabled">
          <q-item class="q-py-md">
            <q-item-section avatar>
              <q-icon
                name="schedule"
                color="grey-7"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ t('timing.label') }}
              </q-item-label>
              <q-option-group
                v-model="settings.timing"
                :options="timingOptions"
                :disable="isLoading"
                class="q-mt-sm"
                data-test="payment-settings-timing"
              />
            </q-item-section>
          </q-item>

          <q-item class="q-py-md">
            <q-item-section avatar>
              <q-icon
                name="notifications"
                color="grey-7"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ t('reminder.label') }}
              </q-item-label>
              <q-item-label caption>
                {{ t('reminder.description') }}
              </q-item-label>
              <q-input
                v-if="settings.reminderAfterDays !== null"
                :model-value="settings.reminderAfterDays"
                type="number"
                :min="1"
                :max="365"
                dense
                outlined
                :suffix="t('reminder.days')"
                :disable="isLoading"
                class="q-mt-sm reminder-input"
                @update:model-value="updateReminderDays"
              />
            </q-item-section>
            <q-item-section
              side
              top
            >
              <q-toggle
                :model-value="settings.reminderAfterDays !== null"
                :disable="isLoading"
                @update:model-value="
                  (on) => (settings.reminderAfterDays = on ? 7 : null)
                "
              />
            </q-item-section>
          </q-item>
        </template>

        <q-item class="q-py-md">
          <q-item-section avatar>
            <q-icon
              name="currency_exchange"
              color="grey-7"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ t('currency.label') }}
            </q-item-label>
            <q-item-label caption>
              {{ t('currency.description') }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-select
              :model-value="event?.currency"
              :options="currencyOptions"
              emit-value
              map-options
              dense
              outlined
              options-dense
              :disable="!event"
              class="currency-select"
              data-test="payment-settings-currency"
              @update:model-value="updateCurrency"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <q-card
        v-if="settings.enabled"
        flat
        bordered
        class="rounded-borders"
      >
        <q-card-section class="row no-wrap q-gutter-x-md">
          <q-icon
            name="calculate"
            size="sm"
            color="grey-7"
          />
          <div class="text-body2 text-on-surface-variant">
            {{ t('amount.hint', { price: formattedPrice }) }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import type { EventPaymentStatus } from '@camp-registration/common/entities';
import {
  SETTING_KEYS,
  type PaymentSettings,
} from '@camp-registration/common/settings';
import { formatMoney, toMinorUnits } from '@camp-registration/common/utils';
import { useEventSettings } from '@/composables/eventSettings';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useAPIService } from '@/services/APIService';

const { t, locale } = useI18n();
const api = useAPIService();
const eventDetailsStore = useEventDetailsStore();
const { data: event } = storeToRefs(eventDetailsStore);

const { settings, isLoading } = useEventSettings<PaymentSettings>(
  SETTING_KEYS.PAYMENT,
  { enabled: false, timing: 'ACCEPTANCE', reminderAfterDays: null },
);

const status = ref<EventPaymentStatus | null>(null);

async function loadStatus(): Promise<void> {
  const eventId = event.value?.id;
  if (!eventId) {
    return;
  }

  try {
    status.value = await api.fetchEventPaymentStatus(eventId);
  } catch {
    status.value = null;
  }
}

onMounted(loadStatus);
watch(() => event.value?.id, loadStatus);

const timingOptions = computed(() => [
  {
    value: 'REGISTRATION',
    label: t('timing.registration'),
  },
  {
    value: 'ACCEPTANCE',
    label: t('timing.acceptance'),
  },
]);

// Common currencies first, then everything the browser knows.
const PREFERRED_CURRENCIES = ['EUR', 'CHF', 'CZK', 'PLN', 'GBP', 'USD'];

const currencyOptions = computed(() => {
  const all = Intl.supportedValuesOf('currency');
  const ordered = [
    ...PREFERRED_CURRENCIES.filter((code) => all.includes(code)),
    ...all.filter((code) => !PREFERRED_CURRENCIES.includes(code)),
  ];
  const names = new Intl.DisplayNames([locale.value], { type: 'currency' });

  return ordered.map((code) => ({
    value: code,
    label: `${code} – ${names.of(code) ?? code}`,
  }));
});

const formattedPrice = computed<string>(() => {
  if (!event.value) {
    return '';
  }

  return formatMoney(
    toMinorUnits(event.value.price, event.value.currency),
    event.value.currency,
    locale.value,
  );
});

function updateReminderDays(value: string | number | null) {
  const days = Number(value);
  if (Number.isInteger(days) && days >= 1 && days <= 365) {
    settings.reminderAfterDays = days;
  }
}

async function updateCurrency(currency: string) {
  await eventDetailsStore.updateData({ currency }, 'result');
}
</script>

<style scoped>
.currency-select {
  min-width: 200px;
}

.reminder-input {
  max-width: 160px;
}

@media (max-width: 599px) {
  .payment-settings-page {
    padding-top: 24px;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Payments'
subtitle: 'Collect participation fees online through the payment provider connected to the organization.'
warning:
  noAccount: 'The organization has not connected a payment provider yet. Registrations still record what people owe, but they can only pay online once an organization administrator connects one.'
  unverified: 'The organization is not verified yet. Payments become possible once it is.'
  testMode: 'The connected payment account is in test mode — no real money is collected.'
enabled:
  label: 'Collect payments'
  description: 'New registrations owe a participation fee they can pay online.'
timing:
  label: 'When do participants pay?'
  registration: 'Right after registering (waitlisted registrations pay once accepted)'
  acceptance: 'After their registration is accepted (payment link by email)'
reminder:
  label: 'Payment reminders'
  description: 'Remind participants with an outstanding balance by email.'
  days: 'days'
currency:
  label: 'Currency'
  description: 'The currency of the price and all payments of this event.'
amount:
  hint: 'Participants owe the event price ({price}) by default. To calculate the amount from their answers, set the data mapping of number or expression questions to "Payment amount" in the form editor — their values are added up.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zahlungen'
subtitle: 'Teilnahmebeiträge online über den mit der Organisation verbundenen Zahlungsanbieter einziehen.'
warning:
  noAccount: 'Die Organisation hat noch keinen Zahlungsanbieter verbunden. Anmeldungen erfassen trotzdem den fälligen Betrag, online bezahlt werden kann aber erst, wenn eine Administratorin oder ein Administrator der Organisation einen verbindet.'
  unverified: 'Die Organisation ist noch nicht verifiziert. Zahlungen sind möglich, sobald sie es ist.'
  testMode: 'Das verbundene Zahlungskonto ist im Testmodus — es wird kein echtes Geld eingezogen.'
enabled:
  label: 'Zahlungen einziehen'
  description: 'Neue Anmeldungen schulden einen Teilnahmebeitrag, der online bezahlt werden kann.'
timing:
  label: 'Wann wird bezahlt?'
  registration: 'Direkt nach der Anmeldung (Anmeldungen auf der Warteliste zahlen nach Zusage)'
  acceptance: 'Nach Zusage der Anmeldung (Zahlungslink per E-Mail)'
reminder:
  label: 'Zahlungserinnerungen'
  description: 'Teilnehmende mit offenem Betrag per E-Mail erinnern.'
  days: 'Tage'
currency:
  label: 'Währung'
  description: 'Die Währung des Preises und aller Zahlungen dieser Veranstaltung.'
amount:
  hint: 'Standardmäßig ist der Veranstaltungspreis ({price}) fällig. Um den Betrag aus den Antworten zu berechnen, setze im Formulareditor die Datenzuordnung von Zahlen- oder Ausdrucksfragen auf „Zahlungsbetrag“ — ihre Werte werden addiert.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Paiements'
subtitle: "Encaisser les frais de participation en ligne via le prestataire de paiement connecté à l'organisation."
warning:
  noAccount: "L'organisation n'a pas encore connecté de prestataire de paiement. Les inscriptions enregistrent quand même le montant dû, mais le paiement en ligne ne sera possible qu'une fois qu'un administrateur de l'organisation en aura connecté un."
  unverified: "L'organisation n'est pas encore vérifiée. Les paiements seront possibles dès qu'elle le sera."
  testMode: "Le compte de paiement connecté est en mode test — aucun argent réel n'est encaissé."
enabled:
  label: 'Encaisser des paiements'
  description: 'Les nouvelles inscriptions doivent des frais de participation payables en ligne.'
timing:
  label: 'Quand les participants paient-ils ?'
  registration: "Juste après l'inscription (les inscriptions en liste d'attente paient une fois acceptées)"
  acceptance: "Après l'acceptation de l'inscription (lien de paiement par e-mail)"
reminder:
  label: 'Rappels de paiement'
  description: 'Rappeler par e-mail les participants ayant un solde impayé.'
  days: 'jours'
currency:
  label: 'Devise'
  description: 'La devise du prix et de tous les paiements de cet événement.'
amount:
  hint: "Par défaut, les participants doivent le prix de l'événement ({price}). Pour calculer le montant à partir de leurs réponses, définissez dans l'éditeur de formulaire le mappage de données des questions numériques ou d'expression sur « Montant du paiement » — leurs valeurs sont additionnées."
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Płatności'
subtitle: 'Pobieraj opłaty za udział online przez operatora płatności połączonego z organizacją.'
warning:
  noAccount: 'Organizacja nie połączyła jeszcze operatora płatności. Zgłoszenia i tak zapisują należną kwotę, ale zapłacić online będzie można dopiero, gdy administrator organizacji połączy jednego z nich.'
  unverified: 'Organizacja nie jest jeszcze zweryfikowana. Płatności będą możliwe po weryfikacji.'
  testMode: 'Połączone konto płatności działa w trybie testowym — nie są pobierane prawdziwe pieniądze.'
enabled:
  label: 'Pobieraj płatności'
  description: 'Nowe zgłoszenia są zobowiązane do opłaty za udział, którą można zapłacić online.'
timing:
  label: 'Kiedy uczestnicy płacą?'
  registration: 'Zaraz po rejestracji (zgłoszenia z listy oczekujących płacą po akceptacji)'
  acceptance: 'Po zaakceptowaniu zgłoszenia (link do płatności e-mailem)'
reminder:
  label: 'Przypomnienia o płatności'
  description: 'Przypominaj e-mailem uczestnikom z zaległą kwotą.'
  days: 'dni'
currency:
  label: 'Waluta'
  description: 'Waluta ceny i wszystkich płatności tego wydarzenia.'
amount:
  hint: 'Domyślnie uczestnicy płacą cenę wydarzenia ({price}). Aby obliczyć kwotę na podstawie odpowiedzi, ustaw w edytorze formularza mapowanie danych pytań liczbowych lub wyrażeń na „Kwota płatności” — ich wartości są sumowane.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Platby'
subtitle: 'Vybírejte účastnické poplatky online přes platebního poskytovatele propojeného s organizací.'
warning:
  noAccount: 'Organizace zatím nepropojila žádného platebního poskytovatele. Registrace i tak evidují dlužnou částku, online zaplatit ale půjde až poté, co administrátor organizace nějakého propojí.'
  unverified: 'Organizace zatím není ověřena. Platby budou možné, jakmile bude.'
  testMode: 'Propojený platební účet je v testovacím režimu — nevybírají se skutečné peníze.'
enabled:
  label: 'Vybírat platby'
  description: 'Nové registrace dluží účastnický poplatek, který lze zaplatit online.'
timing:
  label: 'Kdy účastníci platí?'
  registration: 'Hned po registraci (registrace z čekací listiny platí po přijetí)'
  acceptance: 'Po přijetí registrace (platební odkaz e-mailem)'
reminder:
  label: 'Připomínky plateb'
  description: 'Připomínat e-mailem účastníkům s neuhrazenou částkou.'
  days: 'dní'
currency:
  label: 'Měna'
  description: 'Měna ceny a všech plateb této akce.'
amount:
  hint: 'Ve výchozím nastavení účastníci dluží cenu akce ({price}). Chceš-li částku vypočítat z odpovědí, nastav v editoru formuláře mapování dat číselných otázek nebo výrazů na „Částka platby“ — jejich hodnoty se sečtou.'
</i18n>
