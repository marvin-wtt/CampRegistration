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

      <m-btn
        v-if="can('event.payments.view')"
        primary
        tonal
        no-caps
        icon="receipt_long"
        :label="t('ledger')"
        :to="{ name: 'management.event.payments' }"
        class="self-start"
        data-test="payment-settings-ledger"
      />

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

      <!-- Registrations accepted before payments were on, or before the
           request date, wait for this one deliberate step. -->
      <q-banner
        v-if="unrequested > 0"
        rounded
        class="bg-primary-container text-on-primary-container"
        data-test="payment-settings-unrequested"
      >
        <template #avatar>
          <q-icon name="forward_to_inbox" />
        </template>
        {{ t('unrequested.text', { count: unrequested }, unrequested) }}
        <template #action>
          <m-btn
            primary
            no-caps
            :label="
              t('unrequested.action', { count: unrequested }, unrequested)
            "
            :loading="requesting"
            data-test="payment-settings-request-all"
            @click="requestAll"
          />
        </template>
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
              <div
                class="column q-mt-sm"
                role="radiogroup"
                :aria-label="t('timing.label')"
                data-test="payment-settings-timing"
              >
                <template
                  v-for="option in timingOptions"
                  :key="option.value"
                >
                  <q-radio
                    :model-value="settings.timing"
                    :val="option.value"
                    :label="option.label"
                    :disable="isLoading"
                    :data-test="`payment-settings-timing-${option.value}`"
                    @update:model-value="updateTiming"
                  />
                  <!-- Each option's own setting sits right under it. -->
                  <div
                    v-if="option.value === 'DATE' && settings.timing === 'DATE'"
                    class="timing-detail"
                  >
                    <date-input
                      :model-value="settings.requestDate"
                      :label="t('timing.date')"
                      :max="eventStartDate"
                      data-test="payment-settings-request-date"
                      @update:model-value="updateRequestDate"
                    />
                  </div>
                  <div
                    v-else-if="
                      option.value === 'BEFORE_START' &&
                      settings.timing === 'BEFORE_START'
                    "
                    class="timing-detail"
                  >
                    <q-input
                      :model-value="settings.requestDaysBeforeStart"
                      type="number"
                      :min="0"
                      :max="365"
                      :label="t('timing.days')"
                      :suffix="t('timing.daysSuffix')"
                      :disable="isLoading"
                      outlined
                      rounded
                      hide-bottom-space
                      data-test="payment-settings-request-days"
                      @update:model-value="updateDaysBeforeStart"
                    />
                  </div>
                </template>
              </div>
              <q-item-label
                v-if="requestDateLabel"
                caption
                class="q-mt-xs"
                data-test="payment-settings-request-preview"
              >
                {{ t('timing.preview', { date: requestDateLabel }) }}
              </q-item-label>
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
              :hint="status?.currencyLocked ? t('currency.locked') : undefined"
              :options="currencyOptions"
              emit-value
              map-options
              dense
              outlined
              options-dense
              :disable="!event || status?.currencyLocked === true"
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
  type PaymentTiming,
} from '@camp-registration/common/settings';
import {
  formatMoney,
  paymentRequestDate,
  SUPPORTED_CURRENCIES,
  paymentRequestsOpen,
  toMinorUnits,
} from '@camp-registration/common/utils';
import { useQuasar } from 'quasar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import DateInput from '@/components/common/inputs/DateInput.vue';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import { usePermissions } from '@/composables/permissions';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { useEventSettings } from '@/composables/eventSettings';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useAPIService } from '@/services/APIService';

const { t, locale } = useI18n();
const api = useAPIService();
const quasar = useQuasar();
const { can } = usePermissions();
const { extractErrorText } = useErrorExtractor();
const eventDetailsStore = useEventDetailsStore();
const { data: event } = storeToRefs(eventDetailsStore);

const { settings, isLoading } = useEventSettings<PaymentSettings>(
  SETTING_KEYS.PAYMENT,
  {
    enabled: false,
    timing: 'ACCEPTANCE',
    requestDate: null,
    requestDaysBeforeStart: null,
    reminderAfterDays: null,
  },
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

// Only offered while requests may go out, and only to those allowed to.
const unrequested = computed<number>(() => {
  if (
    !status.value ||
    !event.value ||
    !settings.enabled ||
    !can('event.payments.create') ||
    !paymentRequestsOpen(settings, event.value)
  ) {
    return 0;
  }
  return status.value.unrequested;
});

const requesting = ref(false);

function requestAll(): void {
  const eventId = event.value?.id;
  if (!eventId) {
    return;
  }

  quasar
    .dialog({
      component: ConfirmDialog,
      componentProps: {
        title: t('unrequested.confirm.title'),
        message: t(
          'unrequested.confirm.message',
          { count: unrequested.value },
          unrequested.value,
        ),
        okLabel: t('unrequested.confirm.ok'),
      },
    })
    .onOk(() => {
      void sendAllRequests(eventId);
    });
}

async function sendAllRequests(eventId: string): Promise<void> {
  requesting.value = true;
  try {
    const { requested } = await api.requestAllPayments(eventId);
    quasar.notify({
      type: 'positive',
      message: t('unrequested.done', { count: requested }, requested),
    });
  } catch (err) {
    quasar.notify({ type: 'negative', message: extractErrorText(err) });
  } finally {
    requesting.value = false;
    await loadStatus();
  }
}

onMounted(loadStatus);
watch(() => event.value?.id, loadStatus);

const timingOptions = computed<{ value: PaymentTiming; label: string }[]>(
  () => [
    { value: 'ACCEPTANCE', label: t('timing.acceptance') },
    { value: 'DATE', label: t('timing.fixedDate') },
    { value: 'BEFORE_START', label: t('timing.beforeStart') },
  ],
);

const DEFAULT_DAYS_BEFORE_START = 30;

// Settings save on every change, so a date-based timing gets its date along.
function updateTiming(timing: PaymentTiming) {
  if (timing === 'DATE' && settings.requestDate === null && event.value) {
    settings.requestDate = paymentRequestDate(
      {
        timing: 'BEFORE_START',
        requestDate: null,
        requestDaysBeforeStart: DEFAULT_DAYS_BEFORE_START,
      },
      event.value.startAt,
    );
  }
  if (timing === 'BEFORE_START' && settings.requestDaysBeforeStart === null) {
    settings.requestDaysBeforeStart = DEFAULT_DAYS_BEFORE_START;
  }
  settings.timing = timing;
}

// The date stays required for this timing, so clearing it is ignored.
function updateRequestDate(value: string | null) {
  if (value) {
    settings.requestDate = value;
  }
}

// Asking after the event has started would come too late.
const eventStartDate = computed<string | undefined>(() =>
  event.value?.startAt.slice(0, 10),
);

function updateDaysBeforeStart(value: string | number | null) {
  const days = Number(value);
  if (Number.isInteger(days) && days >= 0 && days <= 365) {
    settings.requestDaysBeforeStart = days;
  }
}

const requestDateLabel = computed<string | null>(() => {
  const date = event.value
    ? paymentRequestDate(settings, event.value.startAt)
    : null;
  if (!date) {
    return null;
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
});

// The currencies an event can charge in (two decimal places).
const currencyOptions = computed(() => {
  const names = new Intl.DisplayNames([locale.value], { type: 'currency' });

  return SUPPORTED_CURRENCIES.map((code) => ({
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

.timing-detail {
  max-width: 260px;
  margin: 4px 0 8px 40px;
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
ledger: 'Open payment ledger'
warning:
  noAccount: 'The organization has not connected a payment provider yet. Registrations still record what people owe, but they can only pay online once an organization administrator connects one.'
  unverified: 'The organization is not verified yet. Payments become possible once it is.'
  testMode: 'The connected payment account is in test mode — no real money is collected.'
enabled:
  label: 'Collect payments'
  description: 'New registrations owe a participation fee they can pay online.'
timing:
  label: 'When do participants pay?'
  acceptance: 'As soon as their registration is accepted — with automatic confirmation, right after registering (payment link by email)'
  fixedDate: 'From a date of your choice (payment link by email to everyone accepted by then)'
  beforeStart: 'A number of days before the event starts (payment link by email)'
  date: 'Request date'
  days: 'Number of days'
  daysSuffix: 'days before the start'
  preview: 'Payment links go out from {date}; anyone accepted later gets theirs right away.'
unrequested:
  text: 'One accepted registration has not been asked to pay yet. | {count} accepted registrations have not been asked to pay yet.'
  action: 'Request payment | Request payment from {count}'
  confirm:
    title: 'Request payment?'
    message: 'The payment link goes out by email to one accepted registration that owes money. | The payment link goes out by email to {count} accepted registrations that owe money.'
    ok: 'Send requests'
  done: 'Payment request sent | {count} payment requests sent'
reminder:
  label: 'Payment reminders'
  description: 'Remind participants with an outstanding balance by email.'
  days: 'days'
currency:
  locked: "Fixed once amounts were quoted or paid — they're stored in this currency."
  label: 'Currency'
  description: 'The currency of the price and all payments of this event.'
amount:
  hint: 'Participants owe the event price ({price}) by default. Choices and yes/no questions can carry a price in the form editor, and questions with the data mapping "Payment amount" add their value — a negative amount is a discount. Only answers that are shown count.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zahlungen'
subtitle: 'Teilnahmebeiträge online über den mit der Organisation verbundenen Zahlungsanbieter einziehen.'
ledger: 'Zahlungsbuch öffnen'
warning:
  noAccount: 'Die Organisation hat noch keinen Zahlungsanbieter verbunden. Anmeldungen erfassen trotzdem den fälligen Betrag, online bezahlt werden kann aber erst, wenn eine Administratorin oder ein Administrator der Organisation einen verbindet.'
  unverified: 'Die Organisation ist noch nicht verifiziert. Zahlungen sind möglich, sobald sie es ist.'
  testMode: 'Das verbundene Zahlungskonto ist im Testmodus — es wird kein echtes Geld eingezogen.'
enabled:
  label: 'Zahlungen einziehen'
  description: 'Neue Anmeldungen schulden einen Teilnahmebeitrag, der online bezahlt werden kann.'
timing:
  label: 'Wann wird bezahlt?'
  acceptance: 'Sobald die Anmeldung angenommen ist — bei automatischer Bestätigung direkt nach der Anmeldung (Zahlungslink per E-Mail)'
  fixedDate: 'Ab einem Datum deiner Wahl (Zahlungslink per E-Mail an alle bis dahin Zugesagten)'
  beforeStart: 'Eine Anzahl Tage vor Beginn der Veranstaltung (Zahlungslink per E-Mail)'
  date: 'Datum der Zahlungsaufforderung'
  days: 'Anzahl Tage'
  daysSuffix: 'Tage vor Beginn'
  preview: 'Zahlungslinks werden ab dem {date} verschickt; wer später zugesagt wird, bekommt seinen sofort.'
unrequested:
  text: 'Eine angenommene Anmeldung wurde noch nicht zur Zahlung aufgefordert. | {count} angenommene Anmeldungen wurden noch nicht zur Zahlung aufgefordert.'
  action: 'Zahlung anfordern | Zahlung von {count} anfordern'
  confirm:
    title: 'Zahlung anfordern?'
    message: 'Der Zahlungslink geht per E-Mail an eine angenommene Anmeldung, die einen Betrag schuldet. | Der Zahlungslink geht per E-Mail an {count} angenommene Anmeldungen, die einen Betrag schulden.'
    ok: 'Aufforderungen senden'
  done: 'Zahlungsaufforderung gesendet | {count} Zahlungsaufforderungen gesendet'
reminder:
  label: 'Zahlungserinnerungen'
  description: 'Teilnehmende mit offenem Betrag per E-Mail erinnern.'
  days: 'Tage'
currency:
  locked: 'Fest, sobald Beträge angeboten oder bezahlt wurden — sie sind in dieser Währung gespeichert.'
  label: 'Währung'
  description: 'Die Währung des Preises und aller Zahlungen dieser Veranstaltung.'
amount:
  hint: 'Standardmäßig ist der Veranstaltungspreis ({price}) fällig. Auswahlmöglichkeiten und Ja/Nein-Fragen können im Formulareditor einen Preis haben, und Fragen mit der Datenzuordnung „Zahlungsbetrag“ addieren ihren Wert — ein negativer Betrag ist ein Rabatt. Es zählen nur angezeigte Antworten.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Paiements'
subtitle: "Encaisser les frais de participation en ligne via le prestataire de paiement connecté à l'organisation."
ledger: 'Ouvrir le registre des paiements'
warning:
  noAccount: "L'organisation n'a pas encore connecté de prestataire de paiement. Les inscriptions enregistrent quand même le montant dû, mais le paiement en ligne ne sera possible qu'une fois qu'un administrateur de l'organisation en aura connecté un."
  unverified: "L'organisation n'est pas encore vérifiée. Les paiements seront possibles dès qu'elle le sera."
  testMode: "Le compte de paiement connecté est en mode test — aucun argent réel n'est encaissé."
enabled:
  label: 'Encaisser des paiements'
  description: 'Les nouvelles inscriptions doivent des frais de participation payables en ligne.'
timing:
  label: 'Quand les participants paient-ils ?'
  acceptance: "Dès que l'inscription est acceptée — avec la confirmation automatique, juste après l'inscription (lien de paiement par e-mail)"
  fixedDate: "À partir d'une date de votre choix (lien de paiement par e-mail à toutes les inscriptions acceptées d'ici là)"
  beforeStart: "Un nombre de jours avant le début de l'événement (lien de paiement par e-mail)"
  date: 'Date de la demande de paiement'
  days: 'Nombre de jours'
  daysSuffix: 'jours avant le début'
  preview: 'Les liens de paiement partent à partir du {date} ; les inscriptions acceptées ensuite reçoivent le leur immédiatement.'
unrequested:
  text: "Une inscription acceptée n'a pas encore été invitée à payer. | {count} inscriptions acceptées n'ont pas encore été invitées à payer."
  action: 'Demander le paiement | Demander le paiement à {count}'
  confirm:
    title: 'Demander le paiement ?'
    message: 'Le lien de paiement est envoyé par e-mail à une inscription acceptée qui doit un montant. | Le lien de paiement est envoyé par e-mail à {count} inscriptions acceptées qui doivent un montant.'
    ok: 'Envoyer les demandes'
  done: 'Demande de paiement envoyée | {count} demandes de paiement envoyées'
reminder:
  label: 'Rappels de paiement'
  description: 'Rappeler par e-mail les participants ayant un solde impayé.'
  days: 'jours'
currency:
  locked: 'Fixée dès que des montants ont été proposés ou payés — ils sont enregistrés dans cette devise.'
  label: 'Devise'
  description: 'La devise du prix et de tous les paiements de cet événement.'
amount:
  hint: "Par défaut, les participants doivent le prix de l'événement ({price}). Dans l'éditeur de formulaire, les choix et les questions oui/non peuvent avoir un prix, et les questions dont le mappage de données est « Montant du paiement » ajoutent leur valeur — un montant négatif est une réduction. Seules les réponses affichées comptent."
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Płatności'
subtitle: 'Pobieraj opłaty za udział online przez operatora płatności połączonego z organizacją.'
ledger: 'Otwórz rejestr płatności'
warning:
  noAccount: 'Organizacja nie połączyła jeszcze operatora płatności. Zgłoszenia i tak zapisują należną kwotę, ale zapłacić online będzie można dopiero, gdy administrator organizacji połączy jednego z nich.'
  unverified: 'Organizacja nie jest jeszcze zweryfikowana. Płatności będą możliwe po weryfikacji.'
  testMode: 'Połączone konto płatności działa w trybie testowym — nie są pobierane prawdziwe pieniądze.'
enabled:
  label: 'Pobieraj płatności'
  description: 'Nowe zgłoszenia są zobowiązane do opłaty za udział, którą można zapłacić online.'
timing:
  label: 'Kiedy uczestnicy płacą?'
  acceptance: 'Gdy tylko zgłoszenie zostanie zaakceptowane — przy automatycznym potwierdzaniu zaraz po rejestracji (link do płatności e-mailem)'
  fixedDate: 'Od wybranej daty (link do płatności e-mailem do wszystkich zaakceptowanych do tego czasu)'
  beforeStart: 'Określoną liczbę dni przed rozpoczęciem wydarzenia (link do płatności e-mailem)'
  date: 'Data wezwania do zapłaty'
  days: 'Liczba dni'
  daysSuffix: 'dni przed rozpoczęciem'
  preview: 'Linki do płatności są wysyłane od {date}; osoby zaakceptowane później dostają swój od razu.'
unrequested:
  text: 'Jedno zaakceptowane zgłoszenie nie zostało jeszcze wezwane do zapłaty. | Zaakceptowane zgłoszenia niewezwane jeszcze do zapłaty: {count}.'
  action: 'Wezwij do zapłaty | Wezwij do zapłaty ({count})'
  confirm:
    title: 'Wezwać do zapłaty?'
    message: 'Link do płatności zostanie wysłany e-mailem do jednego zaakceptowanego zgłoszenia z należnością. | Link do płatności zostanie wysłany e-mailem do zaakceptowanych zgłoszeń z należnością: {count}.'
    ok: 'Wyślij wezwania'
  done: 'Wysłano wezwanie do zapłaty | Wysłane wezwania do zapłaty: {count}'
reminder:
  label: 'Przypomnienia o płatności'
  description: 'Przypominaj e-mailem uczestnikom z zaległą kwotą.'
  days: 'dni'
currency:
  locked: 'Ustalona, gdy tylko pojawiły się kwoty lub płatności — są zapisane w tej walucie.'
  label: 'Waluta'
  description: 'Waluta ceny i wszystkich płatności tego wydarzenia.'
amount:
  hint: 'Domyślnie uczestnicy płacą cenę wydarzenia ({price}). W edytorze formularza opcje wyboru i pytania tak/nie mogą mieć cenę, a pytania z mapowaniem danych „Kwota płatności” dodają swoją wartość — kwota ujemna oznacza zniżkę. Liczą się tylko wyświetlone odpowiedzi.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Platby'
subtitle: 'Vybírejte účastnické poplatky online přes platebního poskytovatele propojeného s organizací.'
ledger: 'Otevřít knihu plateb'
warning:
  noAccount: 'Organizace zatím nepropojila žádného platebního poskytovatele. Registrace i tak evidují dlužnou částku, online zaplatit ale půjde až poté, co administrátor organizace nějakého propojí.'
  unverified: 'Organizace zatím není ověřena. Platby budou možné, jakmile bude.'
  testMode: 'Propojený platební účet je v testovacím režimu — nevybírají se skutečné peníze.'
enabled:
  label: 'Vybírat platby'
  description: 'Nové registrace dluží účastnický poplatek, který lze zaplatit online.'
timing:
  label: 'Kdy účastníci platí?'
  acceptance: 'Jakmile je registrace přijata — při automatickém potvrzení hned po registraci (platební odkaz e-mailem)'
  fixedDate: 'Od data dle tvé volby (platební odkaz e-mailem všem do té doby přijatým)'
  beforeStart: 'Určitý počet dní před začátkem akce (platební odkaz e-mailem)'
  date: 'Datum výzvy k platbě'
  days: 'Počet dní'
  daysSuffix: 'dní před začátkem'
  preview: 'Platební odkazy se posílají od {date}; kdo bude přijat později, dostane svůj hned.'
unrequested:
  text: 'Jedna přijatá registrace ještě nebyla vyzvána k platbě. | Přijaté registrace dosud nevyzvané k platbě: {count}.'
  action: 'Vyžádat platbu | Vyžádat platbu ({count})'
  confirm:
    title: 'Vyžádat platbu?'
    message: 'Platební odkaz odejde e-mailem jedné přijaté registraci, která dluží částku. | Platební odkaz odejde e-mailem přijatým registracím, které dluží částku: {count}.'
    ok: 'Odeslat výzvy'
  done: 'Výzva k platbě odeslána | Odeslané výzvy k platbě: {count}'
reminder:
  label: 'Připomínky plateb'
  description: 'Připomínat e-mailem účastníkům s neuhrazenou částkou.'
  days: 'dní'
currency:
  locked: 'Pevná, jakmile byly částky nabídnuty nebo zaplaceny — jsou uloženy v této měně.'
  label: 'Měna'
  description: 'Měna ceny a všech plateb této akce.'
amount:
  hint: 'Ve výchozím nastavení účastníci dluží cenu akce ({price}). V editoru formuláře mohou mít možnosti výběru a otázky ano/ne cenu a otázky s mapováním dat „Částka platby“ přičtou svou hodnotu — záporná částka je sleva. Počítají se jen zobrazené odpovědi.'
</i18n>
