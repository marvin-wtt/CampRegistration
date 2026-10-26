<template>
  <q-list>
    <q-item
      v-if="!hideDetails"
      v-close-popup
      clickable
      @click="showDetails()"
    >
      <q-item-section>
        {{ t('option.details') }}
      </q-item-section>
    </q-item>

    <!-- Pending registrations can't be written to: the server refuses them. -->
    <q-item
      v-if="can('event.messages.create') && registration.status !== 'PENDING'"
      v-close-popup
      :disable="!hasEmail"
      clickable
      @click="sendMessage"
    >
      <q-item-section>
        {{ t('option.sendMessage') }}
      </q-item-section>
      <q-tooltip v-if="!hasEmail">
        {{ t('option.sendMessageDisabled') }}
      </q-tooltip>
    </q-item>

    <!-- Recording a payment is routine during collection, so it sits here
        rather than at the bottom of the details. -->
    <template v-if="!readonly && canRecordPayment">
      <q-separator />
      <q-item
        v-close-popup
        clickable
        data-test="registration-record-payment"
        @click="recordPayment"
      >
        <q-item-section>
          {{ t('option.recordPayment') }}
        </q-item-section>
      </q-item>
      <q-item
        v-if="canRequestPayment"
        v-close-popup
        clickable
        data-test="registration-request-payment"
        @click="requestPayment"
      >
        <q-item-section>
          {{ t('option.requestPayment') }}
        </q-item-section>
      </q-item>
    </template>

    <template v-if="!readonly && can('event.registrations.edit')">
      <q-separator />

      <q-item
        v-close-popup
        clickable
        @click="editItem"
      >
        <q-item-section>
          {{ t('option.edit') }}
        </q-item-section>
      </q-item>
      <q-item
        v-if="multiCountry"
        v-close-popup
        clickable
        data-test="registration-move"
        @click="moveItem"
      >
        <q-item-section>
          {{ t('option.move') }}
        </q-item-section>
      </q-item>
      <q-item
        v-if="!accepted"
        v-close-popup
        clickable
        @click="accept"
      >
        <q-item-section>
          {{ t('option.accept') }}
        </q-item-section>
      </q-item>
    </template>

    <template v-if="!readonly && can('event.registrations.delete')">
      <q-separator />

      <q-item
        v-close-popup
        class="text-negative"
        clickable
        @click="deleteItem"
      >
        <q-item-section>
          {{ t('option.delete') }}
        </q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import RegistrationEditor from '@/components/event/table/dialogs/RegistrationEditor.vue';

import { useEventDetailsStore } from '@/stores/event-details-store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import type {
  MessageTemplate,
  PaymentCreateData,
  Registration,
  RegistrationDeleteQuery,
  RegistrationUpdateQuery,
} from '@camp-registration/common/entities';
import { useRegistrationsStore } from '@/stores/registration-store';
import { usePermissions } from '@/composables/permissions';
import RegistrationDeleteDialog from '@/components/event/table/dialogs/RegistrationDeleteDialog.vue';
import RegistrationAcceptDialog from '@/components/event/table/dialogs/RegistrationAcceptDialog.vue';
import RegistrationMoveDialog from '@/components/event/table/dialogs/RegistrationMoveDialog.vue';
import RegistrationDetailsDialog from '@/components/event/table/dialogs/RegistrationDetailsDialog.vue';
import RegistrationMessageDialog from '@/components/event/table/dialogs/RegistrationMessageDialog.vue';
import RecordPaymentDialog from '@/components/event/payment/RecordPaymentDialog.vue';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { useAPIService } from '@/services/APIService';
import { useMessageTemplateService } from '@/services/MessageTemplateService';

const {
  registration,
  readonly = false,
  hideDetails = false,
} = defineProps<{
  registration: Registration;
  readonly?: boolean;
  // Set when rendered inside the details dialog itself
  hideDetails?: boolean;
}>();

const quasar = useQuasar();
const { t } = useI18n();
const apiService = useAPIService();
const eventDetailStore = useEventDetailsStore();
const registrationStore = useRegistrationsStore();
const messageTemplateService = useMessageTemplateService();
const { data: eventData } = storeToRefs(eventDetailStore);
const { can } = usePermissions();
const { extractErrorText } = useErrorExtractor();

const accepted = computed<boolean>(() => {
  return registration.status === 'ACCEPTED';
});

// Only for registrations that owe a fee; the request only once accepted.
const canRecordPayment = computed<boolean>(
  () =>
    can('event.payments.create') &&
    registration.payment.status !== 'NOT_REQUIRED',
);
const canRequestPayment = computed<boolean>(
  () => accepted.value && registration.payment.outstanding > 0,
);

function recordPayment() {
  const eventId = eventData.value?.id;
  if (!eventId) {
    return;
  }
  quasar
    .dialog({
      component: RecordPaymentDialog,
      componentProps: {
        currency: registration.payment.currency,
        outstanding: registration.payment.outstanding,
        amountDue: registration.payment.amountDue,
      },
    })
    .onOk((data: PaymentCreateData) => {
      void runPaymentAction(
        () => apiService.createManualPayment(eventId, registration.id, data),
        t('notify.recorded'),
      );
    });
}

function requestPayment() {
  const eventId = eventData.value?.id;
  if (!eventId) {
    return;
  }
  void runPaymentAction(
    () => apiService.requestPayment(eventId, registration.id),
    t('notify.requested'),
  );
}

async function runPaymentAction(
  action: () => Promise<unknown>,
  success: string,
): Promise<void> {
  try {
    await action();
    quasar.notify({ type: 'positive', message: success });
  } catch (err) {
    quasar.notify({ type: 'negative', message: extractErrorText(err) });
  } finally {
    await registrationStore.refreshOne(registration.id);
  }
}

const multiCountry = computed<boolean>(
  () => (eventData.value?.countries.length ?? 0) > 1,
);

// Rare, so it only changes the group: the answers, status and waiting list
// stay, and no message is sent.
function moveItem() {
  if (!eventData.value) {
    return;
  }

  quasar
    .dialog({
      component: RegistrationMoveDialog,
      componentProps: { registration, event: eventData.value },
    })
    .onOk(({ group }: { group: string }) => {
      void registrationStore.updateData(registration.id, { group });
    });
}

const hasEmail = computed<boolean>(() => {
  return !!registration.computedData.emails?.length;
});

let templatesFetch: Promise<MessageTemplate[]> | null = null;

// `null` when the templates couldn't be loaded. Not cached, so the next action retries.
function ensureTemplates(): Promise<MessageTemplate[] | null> {
  const eventId = eventData.value?.id;
  if (!eventId) {
    return Promise.resolve(null);
  }

  templatesFetch ??= messageTemplateService.fetchMessageTemplates(eventId);

  return templatesFetch.catch(() => {
    templatesFetch = null;
    return null;
  });
}

function hasTemplateForTrigger(
  allTemplates: MessageTemplate[] | null,
  trigger: string,
): boolean {
  // Unknown counts as yes: otherwise the dialog hides the "send email" choice
  // and the backend sends one without asking.
  if (allTemplates === null) {
    return true;
  }

  const group = registration.group ?? null;

  return allTemplates
    .filter((tmpl) => tmpl.trigger === trigger)
    .some(
      (tmpl) => group === null || tmpl.group === null || tmpl.group === group,
    );
}

function showDetails(initialTab?: 'payments'): void {
  quasar.dialog({
    component: RegistrationDetailsDialog,
    componentProps: {
      registrationId: registration.id,
      initialTab,
    },
  });
}

function sendMessage(): void {
  quasar.dialog({
    component: RegistrationMessageDialog,
    componentProps: {
      registration,
    },
  });
}

async function deleteItem(): Promise<void> {
  const allTemplates = await ensureTemplates();
  const hasTemplate = hasTemplateForTrigger(
    allTemplates,
    'registration_canceled',
  );

  quasar
    .dialog({
      component: RegistrationDeleteDialog,
      componentProps: {
        registration,
        hasTemplate,
      },
    })
    .onOk((params: RegistrationDeleteQuery | { refundFirst: true }) => {
      if ('refundFirst' in params) {
        showDetails('payments');
        return;
      }
      void registrationStore.deleteData(registration.id, params);
    });
}

async function accept(): Promise<void> {
  const allTemplates = await ensureTemplates();
  const trigger =
    registration.status === 'WAITLISTED'
      ? 'registration_waitlist_accepted'
      : 'registration_confirmed';
  const hasTemplate = hasTemplateForTrigger(allTemplates, trigger);

  quasar
    .dialog({
      component: RegistrationAcceptDialog,
      componentProps: {
        registration,
        hasTemplate,
      },
    })
    .onOk((params: RegistrationUpdateQuery) => {
      void registrationStore.updateData(
        registration.id,
        { status: 'ACCEPTED' },
        params,
      );
    });
}

interface EditCallbackData {
  data: Record<string, unknown>;
  suppressMessage: boolean;
}

async function editItem(): Promise<void> {
  const allTemplates = await ensureTemplates();
  const hasTemplate = hasTemplateForTrigger(
    allTemplates,
    'registration_updated',
  );

  quasar
    .dialog({
      component: RegistrationEditor,
      componentProps: {
        event: eventData.value,
        data: registration.data,
        group: registration.group,
        uploadFileFn: uploadFile,
        hasTemplate,
      },
    })
    .onOk(({ data, suppressMessage }: EditCallbackData) => {
      void registrationStore.updateData(
        registration.id,
        { data },
        { suppressMessage },
      );
    });
}

async function uploadFile(file: File): Promise<string> {
  const serviceFile = await apiService.createTemporaryFile({ file });

  return serviceFile.id;
}
</script>

<i18n lang="yaml" locale="en">
option:
  details: 'Show details'
  sendMessage: 'Send message'
  sendMessageDisabled: 'No email address available'
  edit: 'Edit'
  move: 'Change group'
  delete: 'Delete'
  recordPayment: 'Record payment'
  requestPayment: 'Send payment request'
  accept: 'Accept'
notify:
  recorded: 'Payment recorded'
  requested: 'Payment request sent'
</i18n>

<i18n lang="yaml" locale="de">
option:
  details: 'Details anzeigen'
  sendMessage: 'Nachricht senden'
  sendMessageDisabled: 'Keine E-Mail-Adresse verfügbar'
  edit: 'Bearbeiten'
  move: 'Gruppe wechseln'
  delete: 'Löschen'
  recordPayment: 'Zahlung erfassen'
  requestPayment: 'Zahlungsaufforderung senden'
  accept: 'Akzeptieren'
notify:
  recorded: 'Zahlung erfasst'
  requested: 'Zahlungsaufforderung gesendet'
</i18n>

<i18n lang="yaml" locale="fr">
option:
  details: 'Voir détails'
  sendMessage: 'Envoyer un message'
  sendMessageDisabled: 'Aucune adresse e-mail disponible'
  edit: 'Modifier'
  move: 'Changer de groupe'
  delete: 'Supprimer'
  recordPayment: 'Enregistrer un paiement'
  requestPayment: 'Envoyer une demande de paiement'
  accept: 'Accepter'
notify:
  recorded: 'Paiement enregistré'
  requested: 'Demande de paiement envoyée'
</i18n>

<i18n lang="yaml" locale="pl">
option:
  details: 'Pokaż szczegóły'
  sendMessage: 'Wyślij wiadomość'
  sendMessageDisabled: 'Brak dostępnego adresu e-mail'
  edit: 'Edytuj'
  move: 'Zmień grupę'
  delete: 'Usuń'
  recordPayment: 'Zarejestruj płatność'
  requestPayment: 'Wyślij wezwanie do zapłaty'
  accept: 'Akceptuj'
notify:
  recorded: 'Zarejestrowano płatność'
  requested: 'Wysłano wezwanie do zapłaty'
</i18n>

<i18n lang="yaml" locale="cs">
option:
  details: 'Zobrazit podrobnosti'
  sendMessage: 'Odeslat zprávu'
  sendMessageDisabled: 'Není k dispozici žádná e-mailová adresa'
  edit: 'Upravit'
  move: 'Změnit skupinu'
  delete: 'Smazat'
  recordPayment: 'Zaznamenat platbu'
  requestPayment: 'Odeslat výzvu k platbě'
  accept: 'Přijmout'
notify:
  recorded: 'Platba zaznamenána'
  requested: 'Výzva k platbě odeslána'
</i18n>

<style scoped></style>
