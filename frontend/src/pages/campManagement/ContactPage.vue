<template>
  <page-state-handler
    :error
    :loading
    :prevent-leave="preventLeave"
    class="column"
  >
    <!-- Empty state -->
    <div
      v-if="canSend && registrations.length === 0"
      class="empty-state col column items-center justify-center"
    >
      <q-icon
        name="mail"
        size="64px"
        class="empty-icon"
      />
      <div class="text-h6 q-mt-md">
        {{ t('empty.title') }}
      </div>
      <div class="text-body2 text-grey-6 q-mt-xs text-center">
        {{ t('empty.message') }}
      </div>
    </div>

    <div
      v-else
      class="contact-page col column"
    >
      <header class="contact-header">
        <div class="contact-header__text">
          <div class="text-h5 text-weight-medium">
            {{ canSend ? t('header.title') : t('header.viewTitle') }}
          </div>
          <div class="text-body2 text-grey-6">
            {{ canSend ? t('header.caption') : t('header.viewCaption') }}
          </div>
        </div>
        <sent-message-history
          v-if="canViewHistory"
          :messages="sentMessages ?? []"
          :registrations
          :can-delete="canDeleteHistory"
          :can-reuse="canSend"
          @resend="onResend"
          @delete="onDelete"
        />
      </header>

      <contact-form
        v-if="canSend"
        ref="contactFormRef"
        class="col"
        :registrations
        :draft
        standalone
        @sent="onSent"
      />
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useRegistrationsStore } from 'stores/registration-store';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { Message, Registration } from '@camp-registration/common/entities';
import type { ContactDraft } from 'components/campManagement/contact/Contact';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { usePermissions } from 'src/composables/permissions';
import { useRealtimeCollection } from 'src/composables/realtimeCollection';
import { useAPIService } from 'src/services/APIService';
import ContactForm from 'components/campManagement/contact/ContactForm.vue';
import SentMessageHistory from 'components/campManagement/contact/SentMessageHistory.vue';

const { t } = useI18n();
const quasar = useQuasar();
const { can } = usePermissions();
const apiService = useAPIService();
const registrationStore = useRegistrationsStore();
const campDetailsStore = useCampDetailsStore();

// undefined until the history is loaded (needed by the realtime collection to
// tell "not loaded yet" apart from "empty").
const sentMessages = ref<Message[]>();
const draft = ref<ContactDraft | null>(null);
const contactFormRef = ref<{ dirty: boolean } | null>(null);

// Guard against navigating away while the composer holds unsent content.
const preventLeave = computed<boolean>(
  () => contactFormRef.value?.dirty ?? false,
);

onMounted(async () => {
  await Promise.all([
    campDetailsStore.fetchData(),
    registrationStore.fetchData(),
  ]);
});

const canSend = computed<boolean>(() => can('camp.messages.create'));
const canViewHistory = computed<boolean>(() => can('camp.messages.view'));
const canDeleteHistory = computed<boolean>(() => can('camp.messages.delete'));

async function loadSentMessages() {
  const campId = campDetailsStore.data?.id;
  if (!campId || !canViewHistory.value) {
    return;
  }

  sentMessages.value = await apiService.fetchMessages(campId);
}

// Permissions (campAccess) and camp details may resolve after mount, so load the
// history once both are available rather than only once on mount.
watch(
  () => canViewHistory.value && !!campDetailsStore.data?.id,
  (ready) => {
    if (ready) {
      void loadSentMessages();
    }
  },
  { immediate: true },
);

// React to live changes pushed from other clients. List mode: messages are
// rare and ordered newest-first, so a full reload keeps the order correct.
// The server only sends message events to users with 'camp.messages.view'.
useRealtimeCollection<Message>('message', {
  data: sentMessages,
  // Not loaded yet — the ready-watch above fetches once permitted.
  invalidate: () => {},
  reload: () => loadSentMessages(),
});

function onSent(template: Message) {
  // The create response already carries the recipients, so prepend optimistically.
  sentMessages.value = [template, ...(sentMessages.value ?? [])];
}

async function onResend(template: Message) {
  const campId = campDetailsStore.data?.id;
  if (!campId) {
    return;
  }

  try {
    const attachments = template.attachments?.length
      ? await apiService.duplicateMessageAttachments(campId, template.id)
      : [];

    draft.value = {
      subject: template.subject,
      body: template.body,
      priority:
        template.priority === 'high' || template.priority === 'low'
          ? template.priority
          : 'normal',
      replyTo: template.replyTo,
      attachments,
    };
  } catch {
    quasar.notify({ type: 'negative', message: t('error.reuse') });
  }
}

async function onDelete(template: Message) {
  const campId = campDetailsStore.data?.id;
  if (!campId) {
    return;
  }

  try {
    await apiService.deleteMessage(campId, template.id);
    sentMessages.value = sentMessages.value?.filter(
      (item) => item.id !== template.id,
    );
  } catch {
    quasar.notify({ type: 'negative', message: t('error.delete') });
  }
}

const error = computed<string | null>(() => {
  return registrationStore.error ?? campDetailsStore.error;
});

const loading = computed<boolean>(() => {
  return registrationStore.isLoading || campDetailsStore.isLoading;
});

const registrations = computed<Registration[]>(() => {
  return registrationStore.data ?? [];
});
</script>

<style scoped>
.contact-page {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.contact-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: min(100%, 1040px);
  margin-inline: auto;
  padding: 24px 24px 0;
  gap: 16px;
}

.contact-header__text {
  min-width: 0;
}

@media (max-width: 599px) {
  .contact-header {
    padding: 16px 16px 0;
  }
}

.empty-state {
  padding: 48px 16px;
}

.empty-icon {
  color: var(--md3-on-surface-variant);

  opacity: 0.6;
}
</style>

<i18n lang="yaml" locale="en">
header:
  title: 'Send a message'
  caption: 'Compose an email for one or more registrations.'
  viewTitle: 'Sent messages'
  viewCaption: 'Review the messages sent for this camp.'
empty:
  title: 'No registrations yet'
  message: 'Once people register, you can send them a message from here.'
error:
  delete: 'Failed to delete the message'
  reuse: 'Failed to reuse the message'
</i18n>

<i18n lang="yaml" locale="de">
header:
  title: 'Nachricht senden'
  caption: 'Verfasse eine E-Mail für eine oder mehrere Anmeldungen.'
  viewTitle: 'Gesendete Nachrichten'
  viewCaption: 'Sieh dir die für dieses Camp gesendeten Nachrichten an.'
empty:
  title: 'Noch keine Anmeldungen'
  message: 'Sobald sich Personen anmelden, können Sie ihnen von hier aus eine Nachricht senden.'
error:
  delete: 'Nachricht konnte nicht gelöscht werden'
  reuse: 'Nachricht konnte nicht wiederverwendet werden'
</i18n>

<i18n lang="yaml" locale="fr">
header:
  title: 'Envoyer un message'
  caption: 'Rédigez un e-mail pour une ou plusieurs inscriptions.'
  viewTitle: 'Messages envoyés'
  viewCaption: 'Consultez les messages envoyés pour ce camp.'
empty:
  title: 'Aucune inscription pour le moment'
  message: 'Dès que des personnes s’inscrivent, vous pourrez leur envoyer un message d’ici.'
error:
  delete: 'Échec de la suppression du message'
  reuse: 'Échec de la réutilisation du message'
</i18n>

<i18n lang="yaml" locale="pl">
header:
  title: 'Wyślij wiadomość'
  caption: 'Napisz wiadomość e-mail do jednego lub kilku zgłoszeń.'
  viewTitle: 'Wysłane wiadomości'
  viewCaption: 'Przejrzyj wiadomości wysłane dla tego obozu.'
empty:
  title: 'Brak zgłoszeń'
  message: 'Gdy ktoś się zarejestruje, będziesz mógł stąd wysłać mu wiadomość.'
error:
  delete: 'Nie udało się usunąć wiadomości'
  reuse: 'Nie udało się ponownie użyć wiadomości'
</i18n>

<i18n lang="yaml" locale="cs">
header:
  title: 'Odeslat zprávu'
  caption: 'Napište e-mail pro jednu nebo více registrací.'
  viewTitle: 'Odeslané zprávy'
  viewCaption: 'Prohlédněte si zprávy odeslané pro tento tábor.'
empty:
  title: 'Zatím žádné registrace'
  message: 'Jakmile se někdo zaregistruje, můžete mu odsud poslat zprávu.'
error:
  delete: 'Zprávu se nepodařilo smazat'
  reuse: 'Zprávu se nepodařilo znovu použít'
</i18n>
