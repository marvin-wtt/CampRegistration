<template>
  <page-state-handler
    padding
    :error
    :loading
    :prevent-leave="preventLeave"
    class="row justify-center"
  >
    <!-- Empty state -->
    <div
      v-if="canSend && registrations.length === 0"
      class="empty-state col-12 column items-center justify-center"
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
      class="contact-content col-12 col-md-11 col-lg-10 column no-wrap"
    >
      <page-header
        :title="t('header.title')"
        :subtitle="t('header.subtitle')"
        :inline-actions="sheet"
      >
        <template
          v-if="tab === 'compose' && canReuse"
          #actions
        >
          <m-btn
            v-if="!sheet"
            outline
            no-caps
            icon="content_copy"
            :label="t('action.fromSent')"
            data-test="contact-from-sent"
            @click="pickSentMessage()"
          />
          <m-btn
            v-else
            text
            round
            icon="content_copy"
            :aria-label="t('action.fromSent')"
            data-test="contact-from-sent"
            @click="pickSentMessage()"
          >
            <q-tooltip>{{ t('action.fromSent') }}</q-tooltip>
          </m-btn>
        </template>
      </page-header>

      <div
        v-if="tabs.length > 1"
        class="contact-tabs"
      >
        <q-tabs
          v-model="tab"
          :align="sheet ? 'justify' : 'left'"
          :dense="sheet"
          no-caps
          active-color="primary"
          indicator-color="primary"
          class="text-on-surface-variant"
        >
          <q-tab
            name="compose"
            icon="edit_note"
            :label="t('tab.compose')"
            data-test="contact-tab-compose"
          />
          <q-tab
            name="sent"
            icon="history"
            :label="t('tab.sent')"
            :alert="undeliveredCount > 0 ? 'negative' : false"
            alert-icon="circle"
            data-test="contact-tab-sent"
          >
            <q-tooltip v-if="undeliveredCount > 0">
              {{ t('undelivered', undeliveredCount) }}
            </q-tooltip>
          </q-tab>
        </q-tabs>
        <q-separator />
      </div>

      <!-- Kept mounted, so a draft survives a look at the sent messages. -->
      <contact-form
        v-if="canSend"
        v-show="tab === 'compose'"
        ref="contactFormRef"
        class="contact-compose col"
        :registrations
        :draft
        :persist-key="persistKey"
        @sent="onSent"
      />

      <div
        v-if="canViewHistory"
        v-show="tab === 'sent'"
        class="contact-sent"
        :class="{ 'contact-sent--split': wide }"
      >
        <message-list
          class="contact-sent__list"
          :messages="sentMessages ?? []"
          :selected-id="wide ? (selectedMessage?.id ?? null) : null"
          @select="openMessage"
        />
        <section
          v-if="wide"
          class="contact-sent__detail column no-wrap"
        >
          <message-view
            v-if="selectedMessage"
            class="col"
            :message="selectedMessage"
            :registrations
            :can-delete="canDeleteHistory"
            :can-reuse="canSend"
            @action="(action) => onMessageAction(selectedMessage!, action)"
          />
          <div
            v-else
            class="contact-sent__empty col"
          >
            <q-icon
              name="mark_email_read"
              size="2.5rem"
            />
            <div class="text-body2">{{ t('sentEmpty') }}</div>
          </div>
        </section>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Message, Registration } from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import ContactForm from '@/components/event/contact/ContactForm.vue';
import MessageList from '@/components/event/contact/MessageList.vue';
import MessageView, {
  type MessageAction,
} from '@/components/event/contact/MessageView.vue';
import SentMessagePickerDialog from '@/components/event/contact/SentMessagePickerDialog.vue';
import MessageDetailsDialog from '@/components/event/contact/MessageDetailsDialog.vue';
import type { Contact, ContactDraft } from '@/components/event/contact/Contact';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useProfileStore } from '@/stores/profile-store';
import { usePermissions } from '@/composables/permissions';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import { useRegistrationContact } from '@/composables/registrationContact';
import { useRouteTab } from '@/composables/routeTab';
import { undeliveredRecipients } from '@/components/event/contact/contactHelpers';
import { useAPIService } from '@/services/APIService';

const { t } = useI18n();
const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const { can } = usePermissions();
const apiService = useAPIService();
const registrationStore = useRegistrationsStore();
const eventDetailsStore = useEventDetailsStore();
const profileStore = useProfileStore();
const { contactFor } = useRegistrationContact();

// undefined until the history is loaded (needed by the realtime collection to
// tell "not loaded yet" apart from "empty").
const sentMessages = ref<Message[]>();
const draft = ref<ContactDraft | null>(null);
const contactFormRef = ref<{
  dirty: boolean;
  unsaved: boolean;
  hasContent: boolean;
} | null>(null);

void eventDetailsStore.fetchData();
void registrationStore.fetchData();

const canSend = computed<boolean>(() => can('event.messages.create'));
const canViewHistory = computed<boolean>(() => can('event.messages.view'));
const canDeleteHistory = computed<boolean>(() => can('event.messages.delete'));

type Tab = 'compose' | 'sent';

// Only the tabs this person may use; with one, the bar is left out.
const tabs = computed<Tab[]>(() => [
  ...(canSend.value ? (['compose'] as const) : []),
  ...(canViewHistory.value ? (['sent'] as const) : []),
]);
const tab = useRouteTab(tabs);

// Starting from a sent message needs one to start from.
const canReuse = computed<boolean>(
  () => canViewHistory.value && (sentMessages.value?.length ?? 0) > 0,
);

// List and message side by side.
const wide = computed<boolean>(() => quasar.screen.gt.sm);
// Mirrors ResponsiveDialog's switch to a bottom sheet.
const sheet = computed<boolean>(() => quasar.screen.lt.sm);

// One draft per person and event, kept in this browser.
const persistKey = computed<string | null>(() => {
  const account = profileStore.user?.email;
  const eventId = eventDetailsStore.data?.id;
  return account && eventId ? `${account}:${eventId}` : null;
});

// Messages with a bounce: the reason to open the history at all.
const undeliveredCount = computed<number>(
  () =>
    (sentMessages.value ?? []).filter(
      (message) => undeliveredRecipients(message).length > 0,
    ).length,
);

// Reloading keeps the text; only what storage can't hold blocks leaving.
const preventLeave = computed<boolean>(
  () => contactFormRef.value?.unsaved ?? false,
);

// `?message=<id>` names the open message, so it can be linked to.
const queryMessageId = computed<string | null>(() =>
  typeof route.query.message === 'string' ? route.query.message : null,
);

// Wide, the latest message stands in until one is picked.
const selectedMessage = computed<Message | null>(() => {
  const messages = sentMessages.value ?? [];
  return (
    messages.find((m) => m.id === queryMessageId.value) ?? messages[0] ?? null
  );
});

function withoutMessageQuery() {
  const query = { ...route.query };
  delete query.message;
  return query;
}

function openMessage(message: Message) {
  if (wide.value) {
    void router.replace({ query: { ...route.query, message: message.id } });
    return;
  }
  openMessageSheet(message);
}

function openMessageSheet(message: Message) {
  quasar
    .dialog({
      component: MessageDetailsDialog,
      componentProps: {
        message,
        registrations: registrations.value,
        canDelete: canDeleteHistory.value,
        canReuse: canSend.value,
      },
    })
    .onOk((action: MessageAction) => onMessageAction(message, action));
}

// Narrow, a linked message opens as a sheet once the history is in.
watch(
  [queryMessageId, sentMessages],
  ([id, messages]) => {
    if (wide.value || !id || !messages) {
      return;
    }
    const message = messages.find((m) => m.id === id);
    void router.replace({ query: withoutMessageQuery() });
    if (message) {
      openMessageSheet(message);
    }
  },
  { immediate: true },
);

function pickSentMessage() {
  quasar
    .dialog({
      component: SentMessagePickerDialog,
      componentProps: { messages: sentMessages.value ?? [] },
    })
    .onOk((message: Message) => void loadIntoComposer(message));
}

async function loadSentMessages() {
  const eventId = eventDetailsStore.data?.id;
  if (!eventId || !canViewHistory.value) {
    return;
  }

  sentMessages.value = await apiService.fetchMessages(eventId);
}

// Permissions (eventAccess) and event details may resolve after mount, so load the
// history once both are available rather than only once on mount.
watch(
  () => canViewHistory.value && !!eventDetailsStore.data?.id,
  (ready) => {
    if (ready) {
      void loadSentMessages();
    }
  },
  { immediate: true },
);

// React to live changes pushed from other clients. List mode: messages are
// rare and ordered newest-first, so a full reload keeps the order correct.
// The server only sends message events to users with 'event.messages.view'.
useRealtimeCollection<Message>('message', {
  data: sentMessages,
  // Not loaded yet — the ready-watch above fetches once permitted.
  invalidate: () => {},
  reload: () => loadSentMessages(),
});

function onSent(message: Message) {
  // The create response already carries the recipients, so prepend optimistically.
  sentMessages.value = [message, ...(sentMessages.value ?? [])];
  // Clear the reuse draft so the form's dirty check compares against the blank
  // pristine state instead of the now-stale draft it was reset away from.
  draft.value = null;
}

function onMessageAction(message: Message, action: MessageAction) {
  switch (action.action) {
    case 'reuse':
      void loadIntoComposer(message);
      break;
    case 'retry':
      void loadIntoComposer(message, action.recipients.map(contactFor));
      break;
    case 'delete':
      confirmDelete(message);
      break;
  }
}

// Loading replaces what is in the composer, so a draft is never dropped silently.
function confirmReplace(): Promise<boolean> {
  if (!contactFormRef.value?.hasContent) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    quasar
      .dialog({
        title: t('dialog.replace.title'),
        message: t('dialog.replace.message'),
        ok: {
          label: t('dialog.replace.ok'),
          color: 'primary',
          rounded: true,
        },
        cancel: {
          color: 'primary',
          flat: true,
          rounded: true,
        },
        persistent: true,
      })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });
}

async function loadIntoComposer(message: Message, recipients?: Contact[]) {
  const eventId = eventDetailsStore.data?.id;
  if (!eventId || !(await confirmReplace())) {
    return;
  }

  try {
    const attachments = message.attachments?.length
      ? await apiService.duplicateMessageAttachments(eventId, message.id)
      : [];

    draft.value = {
      ...(recipients ? { recipients } : {}),
      subject: message.subject,
      body: message.body,
      priority:
        message.priority === 'high' || message.priority === 'low'
          ? message.priority
          : 'normal',
      replyTo: message.replyTo,
      attachments,
    };
    tab.value = 'compose';
  } catch {
    quasar.notify({ type: 'negative', message: t('error.reuse') });
  }
}

function confirmDelete(message: Message) {
  quasar
    .dialog({
      title: t('dialog.delete.title'),
      message: t('dialog.delete.message'),
      ok: {
        label: t('dialog.delete.ok'),
        color: 'negative',
        rounded: true,
      },
      cancel: {
        color: 'primary',
        flat: true,
        rounded: true,
      },
      persistent: true,
    })
    .onOk(() => void deleteMessage(message));
}

async function deleteMessage(message: Message) {
  const eventId = eventDetailsStore.data?.id;
  if (!eventId) {
    return;
  }

  try {
    await apiService.deleteMessage(eventId, message.id);
    sentMessages.value = sentMessages.value?.filter(
      (item) => item.id !== message.id,
    );
    if (queryMessageId.value === message.id) {
      void router.replace({ query: withoutMessageQuery() });
    }
  } catch {
    quasar.notify({ type: 'negative', message: t('error.delete') });
  }
}

const error = computed<string | null>(() => {
  return registrationStore.error ?? eventDetailsStore.error;
});

const loading = computed<boolean>(() => {
  return registrationStore.isLoading || eventDetailsStore.isLoading;
});

const registrations = computed<Registration[]>(() => {
  return registrationStore.data ?? [];
});
</script>

<style scoped>
.contact-content {
  max-width: 1040px;
  gap: 16px;
}

.contact-compose {
  min-height: 0;
}

.contact-sent--split {
  display: grid;
  grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
  align-items: start;
  gap: 16px;
}

/* Stays in view while a long list scrolls past. */
.contact-sent__detail {
  position: sticky;
  top: 16px;
  max-height: calc(100dvh - 32px);
  min-width: 0;
  overflow: hidden;
}

.contact-sent__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 32px;
  color: var(--md3-on-surface-variant);
  text-align: center;
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
  title: 'Messages'
  subtitle: 'Email registrations and look up what was sent.'
tab:
  compose: 'Write'
  sent: 'Sent'
undelivered: '{n} message was not delivered to everyone | {n} messages were not delivered to everyone'
sentEmpty: 'Messages you send appear here.'
action:
  fromSent: 'Start from a sent message'
empty:
  title: 'No registrations yet'
  message: 'Once people register, you can send them a message from here.'
dialog:
  delete:
    title: 'Delete message'
    message: 'Delete this sent message from the history? Already delivered emails are not affected.'
    ok: 'Delete'
  replace:
    title: 'Replace your draft?'
    message: 'The message you are writing will be replaced.'
    ok: 'Replace'
error:
  delete: 'Failed to delete the message'
  reuse: 'Failed to reuse the message'
</i18n>

<i18n lang="yaml" locale="de">
header:
  title: 'Nachrichten'
  subtitle: 'Schreibe Anmeldungen per E-Mail an und sieh nach, was gesendet wurde.'
tab:
  compose: 'Schreiben'
  sent: 'Gesendet'
undelivered: '{n} Nachricht wurde nicht allen zugestellt | {n} Nachrichten wurden nicht allen zugestellt'
sentEmpty: 'Von dir gesendete Nachrichten erscheinen hier.'
action:
  fromSent: 'Aus gesendeter Nachricht'
empty:
  title: 'Noch keine Anmeldungen'
  message: 'Sobald sich Personen anmelden, können Sie ihnen von hier aus eine Nachricht senden.'
dialog:
  delete:
    title: 'Nachricht löschen'
    message: 'Diese gesendete Nachricht aus dem Verlauf löschen? Bereits zugestellte E-Mails sind nicht betroffen.'
    ok: 'Löschen'
  replace:
    title: 'Entwurf ersetzen?'
    message: 'Die Nachricht, die du gerade schreibst, wird ersetzt.'
    ok: 'Ersetzen'
error:
  delete: 'Nachricht konnte nicht gelöscht werden'
  reuse: 'Nachricht konnte nicht wiederverwendet werden'
</i18n>

<i18n lang="yaml" locale="fr">
header:
  title: 'Messages'
  subtitle: 'Écrivez aux inscrits par e-mail et retrouvez les envois.'
tab:
  compose: 'Écrire'
  sent: 'Envoyés'
undelivered: '{n} message n’a pas été distribué à tous | {n} messages n’ont pas été distribués à tous'
sentEmpty: 'Les messages que vous envoyez apparaissent ici.'
action:
  fromSent: 'Partir d’un message envoyé'
empty:
  title: 'Aucune inscription pour le moment'
  message: 'Dès que des personnes s’inscrivent, vous pourrez leur envoyer un message d’ici.'
dialog:
  delete:
    title: 'Supprimer le message'
    message: "Supprimer ce message envoyé de l'historique ? Les e-mails déjà livrés ne sont pas affectés."
    ok: 'Supprimer'
  replace:
    title: 'Remplacer votre brouillon ?'
    message: 'Le message en cours de rédaction sera remplacé.'
    ok: 'Remplacer'
error:
  delete: 'Échec de la suppression du message'
  reuse: 'Échec de la réutilisation du message'
</i18n>

<i18n lang="yaml" locale="pl">
header:
  title: 'Wiadomości'
  subtitle: 'Pisz do zgłoszonych osób i sprawdzaj, co zostało wysłane.'
tab:
  compose: 'Napisz'
  sent: 'Wysłane'
undelivered: 'Wiadomości niedostarczone do wszystkich: {n} | Wiadomości niedostarczone do wszystkich: {n}'
sentEmpty: 'Wysłane przez Ciebie wiadomości pojawią się tutaj.'
action:
  fromSent: 'Z wysłanej wiadomości'
empty:
  title: 'Brak zgłoszeń'
  message: 'Gdy ktoś się zarejestruje, będziesz mógł stąd wysłać mu wiadomość.'
dialog:
  delete:
    title: 'Usuń wiadomość'
    message: 'Usunąć tę wysłaną wiadomość z historii? Już dostarczone e-maile nie zostaną zmienione.'
    ok: 'Usuń'
  replace:
    title: 'Zastąpić wersję roboczą?'
    message: 'Wiadomość, którą piszesz, zostanie zastąpiona.'
    ok: 'Zastąp'
error:
  delete: 'Nie udało się usunąć wiadomości'
  reuse: 'Nie udało się ponownie użyć wiadomości'
</i18n>

<i18n lang="yaml" locale="cs">
header:
  title: 'Zprávy'
  subtitle: 'Pište registrovaným e-mailem a dohledejte, co bylo odesláno.'
tab:
  compose: 'Napsat'
  sent: 'Odeslané'
undelivered: 'Zprávy nedoručené všem: {n} | Zprávy nedoručené všem: {n}'
sentEmpty: 'Zprávy, které odešlete, se zobrazí zde.'
action:
  fromSent: 'Z odeslané zprávy'
empty:
  title: 'Zatím žádné registrace'
  message: 'Jakmile se někdo zaregistruje, můžete mu odsud poslat zprávu.'
dialog:
  delete:
    title: 'Smazat zprávu'
    message: 'Smazat tuto odeslanou zprávu z historie? Již doručené e-maily nebudou ovlivněny.'
    ok: 'Smazat'
  replace:
    title: 'Nahradit koncept?'
    message: 'Zpráva, kterou píšeš, bude nahrazena.'
    ok: 'Nahradit'
error:
  delete: 'Zprávu se nepodařilo smazat'
  reuse: 'Zprávu se nepodařilo znovu použít'
</i18n>
