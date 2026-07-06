<template>
  <q-btn
    flat
    round
    dense
    icon="history"
    :aria-label="t('title')"
    @click="open = true"
  >
    <q-badge
      v-if="messages.length > 0"
      floating
      color="primary"
    >
      {{ messages.length }}
    </q-badge>
    <q-tooltip>{{ t('title') }}</q-tooltip>
  </q-btn>

  <q-dialog
    v-model="open"
    :maximized="quasar.screen.lt.sm"
  >
    <q-card class="history-dialog column no-wrap">
      <q-toolbar class="q-px-sm">
        <q-btn
          v-if="quasar.screen.lt.sm && mobileDetail"
          flat
          round
          dense
          icon="arrow_back"
          :aria-label="t('action.back')"
          @click="mobileDetail = false"
        />
        <q-icon
          v-else
          name="history"
          size="sm"
          class="q-mx-sm"
        />
        <q-toolbar-title class="text-subtitle1 text-weight-medium">
          {{ t('title') }}
          <span class="text-grey-6">({{ messages.length }})</span>
        </q-toolbar-title>
        <q-btn
          v-close-popup
          flat
          round
          dense
          icon="close"
          :aria-label="t('action.close')"
        />
      </q-toolbar>

      <q-separator />

      <!-- Empty -->
      <div
        v-if="messages.length === 0"
        class="col column items-center justify-center text-grey-6 q-pa-xl"
      >
        <q-icon
          name="mark_email_read"
          size="3rem"
          color="grey-4"
        />
        <div class="text-body2 q-mt-sm text-center">
          {{ t('empty') }}
        </div>
      </div>

      <div
        v-else
        class="history-body row no-wrap col"
      >
        <!-- List pane -->
        <div
          class="history-list column no-wrap"
          :class="{ 'pane--hidden': quasar.screen.lt.sm && mobileDetail }"
        >
          <div class="q-pa-sm">
            <q-input
              v-model="search"
              dense
              outlined
              rounded
              clearable
              :placeholder="t('search')"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <q-separator />

          <q-virtual-scroll
            v-if="filtered.length > 0"
            :items="filtered"
            class="col scroll"
          >
            <template #default="{ item }">
              <q-item
                :key="item.id"
                v-ripple
                clickable
                :active="item.id === selectedId"
                active-class="history-item--active"
                @click="selectMessage(item)"
              >
                <q-item-section avatar>
                  <q-avatar
                    color="primary"
                    text-color="white"
                    size="32px"
                    icon="mail"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    lines="1"
                    class="text-weight-medium"
                  >
                    {{ item.subject }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ item.createdAt ? d(item.createdAt, 'dateTime') : '' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip
                    dense
                    outline
                    icon="group"
                    :label="String(recipientCount(item))"
                    color="grey-7"
                    class="q-mr-none"
                  />
                </q-item-section>
              </q-item>
            </template>
          </q-virtual-scroll>

          <div
            v-else
            class="col column items-center justify-center text-grey-6 q-pa-lg"
          >
            <q-icon
              name="search_off"
              size="2.5rem"
              color="grey-4"
            />
            <div class="text-body2 q-mt-sm text-center">
              {{ t('noResults') }}
            </div>
          </div>
        </div>

        <q-separator
          v-if="quasar.screen.gt.xs"
          vertical
        />

        <!-- Detail pane -->
        <div
          class="history-detail column no-wrap col"
          :class="{ 'pane--hidden': quasar.screen.lt.sm && !mobileDetail }"
        >
          <template v-if="selected">
            <div class="col scroll q-pa-md q-gutter-y-md">
              <div>
                <div class="text-subtitle1 text-weight-medium">
                  {{ selected.subject }}
                </div>
                <div class="text-caption text-grey-6">
                  {{
                    selected.createdAt ? d(selected.createdAt, 'dateTime') : ''
                  }}
                </div>
                <div
                  v-if="selected.sentBy"
                  class="text-caption text-grey-6 row items-center q-gutter-xs no-wrap"
                >
                  <q-icon
                    name="person"
                    size="14px"
                  />
                  <span>
                    {{ t('sentBy', { name: selected.sentBy.name ?? '' }) }}
                  </span>
                </div>
              </div>

              <!-- Reply-to -->
              <div v-if="selected.replyTo">
                <div class="text-caption text-grey-7 q-mb-xs">
                  {{ t('replyTo') }}
                </div>
                <q-chip
                  dense
                  square
                  icon="reply"
                  color="grey-3"
                  text-color="grey-9"
                >
                  {{ selected.replyTo }}
                </q-chip>
              </div>

              <!-- Recipients -->
              <div>
                <div class="text-caption text-grey-7 q-mb-xs">
                  {{ t('recipients', { count: recipientCount(selected) }) }}
                </div>
                <div class="recipient-chips row q-gutter-xs">
                  <q-chip
                    v-for="entry in recipientEntries(selected)"
                    :key="entry.key"
                    dense
                    square
                    color="grey-3"
                    text-color="grey-9"
                  >
                    {{ entry.name }}
                    <q-tooltip v-if="entry.emails.length > 0">
                      <div
                        v-for="email in entry.emails"
                        :key="email"
                      >
                        {{ email }}
                      </div>
                    </q-tooltip>
                  </q-chip>
                </div>
              </div>

              <!-- Attachments -->
              <div
                v-if="selected.attachments?.length"
                class="row items-center q-gutter-xs"
              >
                <q-chip
                  v-for="file in selected.attachments"
                  :key="file.id"
                  clickable
                  dense
                  icon="attach_file"
                  icon-right="open_in_new"
                  color="grey-3"
                  text-color="grey-9"
                  @click="openAttachment(file)"
                >
                  {{ file.name }}
                  <q-tooltip>{{ t('action.view') }}</q-tooltip>
                </q-chip>
              </div>

              <q-separator />

              <!-- Body -->
              <div
                class="message-preview"
                v-html="selectedBody"
              />
            </div>

            <q-separator />

            <div class="row justify-end q-gutter-sm q-pa-md">
              <q-btn
                v-if="canDelete"
                flat
                no-caps
                rounded
                color="negative"
                icon="delete_outline"
                :label="t('action.delete')"
                @click="confirmDelete(selected)"
              />
              <q-btn
                v-if="canReuse"
                unelevated
                no-caps
                rounded
                color="primary"
                icon="edit_note"
                :label="t('action.reuse')"
                @click="onResend(selected)"
              />
            </div>
          </template>

          <div
            v-else
            class="col column items-center justify-center text-grey-6 q-pa-xl"
          >
            <q-icon
              name="drafts"
              size="2.5rem"
              color="grey-4"
            />
            <div class="text-body2 q-mt-sm text-center">
              {{ t('selectHint') }}
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import DOMPurify from 'dompurify';
import type {
  Message,
  Registration,
  ServiceFile,
} from '@camp-registration/common/entities';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import { formatPersonName } from 'src/utils/formatters';
import { useAPIService } from 'src/services/APIService';

const {
  messages,
  registrations,
  canDelete = false,
  canReuse = false,
} = defineProps<{
  messages: Message[];
  registrations: Registration[];
  canDelete?: boolean;
  canReuse?: boolean;
}>();

const emit = defineEmits<{
  (e: 'resend', template: Message): void;
  (e: 'delete', template: Message): void;
}>();

const { t, d } = useI18n();
const quasar = useQuasar();
const apiService = useAPIService();
const { fullName, emails } = useRegistrationHelper();

const open = ref<boolean>(false);
const search = ref<string>('');
const selectedId = ref<string | null>(null);
const mobileDetail = ref<boolean>(false);

const registrationsById = computed(
  () => new Map(registrations.map((r) => [r.id, r])),
);

const filtered = computed<Message[]>(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) {
    return messages;
  }
  return messages.filter((message) =>
    message.subject.toLowerCase().includes(query),
  );
});

const selected = computed<Message | null>(
  () => messages.find((message) => message.id === selectedId.value) ?? null,
);

// Only the open message is sanitized, so the list scales without parsing every body.
const selectedBody = computed<string>(() =>
  selected.value ? DOMPurify.sanitize(selected.value.body) : '',
);

function recipientCount(template: Message): number {
  return template.recipients?.length ?? 0;
}

interface RecipientEntry {
  key: string;
  name: string;
  emails: string[];
}

function recipientEntries(template: Message): RecipientEntry[] {
  return (template.recipients ?? []).map((recipient, index) => {
    const registration = registrationsById.value.get(recipient.registrationId);
    const name = registration
      ? formatPersonName(fullName(registration))
      : undefined;
    // Prefer the registration's known addresses; fall back to the address the
    // message was actually delivered to.
    const addresses = registration ? emails(registration) : [];
    const resolvedEmails =
      addresses.length > 0 ? addresses : recipient.to ? [recipient.to] : [];

    return {
      key: `${recipient.registrationId}-${index}`,
      name: name ?? recipient.to ?? recipient.registrationId,
      emails: resolvedEmails,
    };
  });
}

function selectMessage(template: Message) {
  selectedId.value = template.id;
  if (quasar.screen.lt.sm) {
    mobileDetail.value = true;
  }
}

function openAttachment(file: ServiceFile) {
  window.open(apiService.getFileUrl(file.id), '_blank', 'noopener');
}

function onResend(template: Message) {
  emit('resend', template);
  open.value = false;
}

function confirmDelete(template: Message) {
  quasar
    .dialog({
      title: t('dialog.delete.title'),
      message: t('dialog.delete.message'),
      ok: {
        label: t('action.delete'),
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
    .onOk(() => {
      emit('delete', template);
    });
}

// On wide screens auto-select the first message so the detail pane isn't empty.
watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }
  mobileDetail.value = false;
  if (quasar.screen.gt.xs && !selected.value) {
    selectedId.value = filtered.value[0]?.id ?? null;
  }
});

// Keep the selection valid as the list changes (e.g. after a delete).
watch(
  () => messages,
  (list) => {
    if (selectedId.value && !list.some((m) => m.id === selectedId.value)) {
      selectedId.value = quasar.screen.gt.xs ? (list[0]?.id ?? null) : null;
      if (quasar.screen.lt.sm) {
        mobileDetail.value = false;
      }
    }
  },
);
</script>

<style scoped>
.history-dialog {
  width: 900px;
  max-width: 95vw;
  height: 80vh;
  max-height: 85vh;
  background: var(--md3-surface);
}

.history-body {
  min-height: 0;
}

.history-list,
.history-detail {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}

.history-detail {
  flex: 1 1 0;
}

.history-item--active {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.recipient-chips {
  max-height: 140px;
  overflow-y: auto;
}

.message-preview {
  line-height: 1.6;
}

.message-preview :deep(p) {
  margin: 0 0 0.75em;
}

.message-preview :deep(ul),
.message-preview :deep(ol) {
  padding-left: 1.5em;
  margin: 0 0 0.75em;
}

.message-preview :deep(a) {
  color: var(--md3-primary);
}

@media (min-width: 600px) {
  .history-list {
    flex: 0 0 320px;
  }
}

@media (max-width: 599px) {
  .history-list,
  .history-detail {
    flex: 1 1 100%;
    width: 100%;
  }
}

.pane--hidden {
  display: none !important;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Sent messages'
empty: 'Messages you send appear here.'
search: 'Search messages'
noResults: 'No messages match your search.'
selectHint: 'Select a message to view it.'
sentBy: 'Sent by {name}'
replyTo: 'Reply-to'
recipients: '{count} recipient | {count} recipient | {count} recipients'
action:
  reuse: 'Use as template'
  view: 'Open'
  delete: 'Delete'
  close: 'Close'
  back: 'Back'
dialog:
  delete:
    title: 'Delete message'
    message: 'Delete this sent message from the history? Already delivered emails are not affected.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Gesendete Nachrichten'
empty: 'Von dir gesendete Nachrichten erscheinen hier.'
search: 'Nachrichten suchen'
noResults: 'Keine Nachrichten entsprechen deiner Suche.'
selectHint: 'Wähle eine Nachricht aus, um sie anzuzeigen.'
sentBy: 'Gesendet von {name}'
replyTo: 'Antwort an'
recipients: '{count} Empfänger | {count} Empfänger | {count} Empfänger'
action:
  reuse: 'Als Vorlage verwenden'
  view: 'Öffnen'
  delete: 'Löschen'
  close: 'Schließen'
  back: 'Zurück'
dialog:
  delete:
    title: 'Nachricht löschen'
    message: 'Diese gesendete Nachricht aus dem Verlauf löschen? Bereits zugestellte E-Mails sind nicht betroffen.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Messages envoyés'
empty: 'Les messages que vous envoyez apparaissent ici.'
search: 'Rechercher des messages'
noResults: 'Aucun message ne correspond à votre recherche.'
selectHint: 'Sélectionnez un message pour l’afficher.'
sentBy: 'Envoyé par {name}'
replyTo: 'Répondre à'
recipients: '{count} destinataire | {count} destinataire | {count} destinataires'
action:
  reuse: 'Utiliser comme modèle'
  view: 'Ouvrir'
  delete: 'Supprimer'
  close: 'Fermer'
  back: 'Retour'
dialog:
  delete:
    title: 'Supprimer le message'
    message: "Supprimer ce message envoyé de l'historique ? Les e-mails déjà livrés ne sont pas affectés."
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wysłane wiadomości'
empty: 'Wysłane przez Ciebie wiadomości pojawią się tutaj.'
search: 'Szukaj wiadomości'
noResults: 'Brak wiadomości pasujących do wyszukiwania.'
selectHint: 'Wybierz wiadomość, aby ją wyświetlić.'
sentBy: 'Wysłane przez {name}'
replyTo: 'Odpowiedź do'
recipients: '{count} odbiorca | {count} odbiorca | {count} odbiorców'
action:
  reuse: 'Użyj jako szablon'
  view: 'Otwórz'
  delete: 'Usuń'
  close: 'Zamknij'
  back: 'Wstecz'
dialog:
  delete:
    title: 'Usuń wiadomość'
    message: 'Usunąć tę wysłaną wiadomość z historii? Już dostarczone e-maile nie zostaną zmienione.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Odeslané zprávy'
empty: 'Zprávy, které odešlete, se zobrazí zde.'
search: 'Hledat zprávy'
noResults: 'Žádné zprávy neodpovídají hledání.'
selectHint: 'Vyber zprávu pro zobrazení.'
sentBy: 'Odeslal {name}'
replyTo: 'Odpovědět na'
recipients: '{count} příjemce | {count} příjemce | {count} příjemců'
action:
  reuse: 'Použít jako šablonu'
  view: 'Otevřít'
  delete: 'Smazat'
  close: 'Zavřít'
  back: 'Zpět'
dialog:
  delete:
    title: 'Smazat zprávu'
    message: 'Smazat tuto odeslanou zprávu z historie? Již doručené e-maily nebudou ovlivněny.'
</i18n>
