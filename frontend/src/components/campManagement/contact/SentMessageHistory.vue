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
      <q-toolbar class="q-px-md">
        <q-icon
          name="history"
          size="sm"
          class="q-mr-sm"
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
      <q-card-section
        v-if="messages.length === 0"
        class="column items-center q-gutter-sm q-py-xl"
      >
        <q-icon
          name="mark_email_read"
          size="3rem"
          color="grey-4"
        />
        <div class="text-body2 text-grey-6 text-center">
          {{ t('empty') }}
        </div>
      </q-card-section>

      <!-- List -->
      <q-list
        v-else
        separator
        class="col scroll"
      >
        <q-expansion-item
          v-for="template in messages"
          :key="template.id"
          expand-separator
          group="sent-messages"
        >
          <template #header>
            <q-item-section avatar>
              <q-avatar
                color="primary"
                text-color="white"
                size="36px"
                icon="mail"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ template.subject }}
              </q-item-label>
              <q-item-label caption>
                {{ template.createdAt ? d(template.createdAt, 'dateTime') : '' }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-chip
                dense
                outline
                icon="group"
                :label="String(recipientCount(template))"
                color="grey-7"
                class="q-mr-none"
              >
                <q-tooltip>
                  {{ t('recipients', { count: recipientCount(template) }) }}
                </q-tooltip>
              </q-chip>
            </q-item-section>
          </template>

          <q-separator />

          <div class="q-pa-md q-gutter-y-sm">
            <!-- Recipients (collapsed by default to save space) -->
            <q-expansion-item
              dense
              dense-toggle
              switch-toggle-side
              :label="t('recipients', { count: recipientCount(template) })"
              header-class="text-caption text-grey-7 q-px-none"
            >
              <div class="row q-gutter-xs q-pt-sm">
                <q-chip
                  v-for="name in recipientNames(template)"
                  :key="name"
                  dense
                  square
                  color="grey-3"
                  text-color="grey-9"
                >
                  {{ name }}
                </q-chip>
              </div>
            </q-expansion-item>

            <!-- Attachments -->
            <div
              v-if="template.attachments?.length"
              class="row items-center q-gutter-xs"
            >
              <q-chip
                v-for="file in template.attachments"
                :key="file.id"
                dense
                icon="attach_file"
                color="grey-3"
                text-color="grey-9"
              >
                {{ file.name }}
              </q-chip>
            </div>

            <!-- Body -->
            <div
              class="message-preview"
              v-html="sanitizedBodies[template.id]"
            />

            <!-- Actions -->
            <div class="row justify-end q-gutter-sm q-pt-sm">
              <q-btn
                v-if="canDelete"
                flat
                no-caps
                rounded
                color="negative"
                icon="delete_outline"
                :label="t('action.delete')"
                @click="confirmDelete(template)"
              />
              <q-btn
                unelevated
                no-caps
                rounded
                color="primary"
                icon="edit_note"
                :label="t('action.reuse')"
                @click="onResend(template)"
              />
            </div>
          </div>
        </q-expansion-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import DOMPurify from 'dompurify';
import type {
  MessageTemplate,
  Registration,
} from '@camp-registration/common/entities';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import { formatPersonName } from 'src/utils/formatters';

const {
  messages,
  registrations,
  canDelete = false,
} = defineProps<{
  messages: MessageTemplate[];
  registrations: Registration[];
  canDelete?: boolean;
}>();

const emit = defineEmits<{
  (e: 'resend', template: MessageTemplate): void;
  (e: 'delete', template: MessageTemplate): void;
}>();

const { t, d } = useI18n();
const quasar = useQuasar();
const { fullName } = useRegistrationHelper();

const open = ref<boolean>(false);

const registrationsById = computed(
  () => new Map(registrations.map((r) => [r.id, r])),
);

const sanitizedBodies = computed<Record<string, string>>(() =>
  Object.fromEntries(
    messages.map((template) => [
      template.id,
      DOMPurify.sanitize(template.body),
    ]),
  ),
);

function recipientCount(template: MessageTemplate): number {
  return template.recipients?.length ?? 0;
}

function recipientNames(template: MessageTemplate): string[] {
  return (template.recipients ?? [])
    .map((recipient) => {
      const registration = registrationsById.value.get(
        recipient.registrationId,
      );
      const name = registration
        ? formatPersonName(fullName(registration))
        : undefined;
      return name ?? recipient.to ?? recipient.registrationId;
    })
    .filter((name): name is string => !!name);
}

function onResend(template: MessageTemplate) {
  emit('resend', template);
  open.value = false;
}

function confirmDelete(template: MessageTemplate) {
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
</script>

<style scoped>
.history-dialog {
  width: 720px;
  max-width: 90vw;
  max-height: 85vh;
  background: var(--md3-surface);
}

.message-preview {
  line-height: 1.6;
  max-height: 320px;
  overflow-y: auto;
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
</style>

<i18n lang="yaml" locale="en">
title: 'Sent messages'
empty: 'Messages you send appear here.'
recipients: '{count} recipient | {count} recipient | {count} recipients'
action:
  reuse: 'Use as template'
  delete: 'Delete'
  close: 'Close'
dialog:
  delete:
    title: 'Delete message'
    message: 'Delete this sent message from the history? Already delivered emails are not affected.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Gesendete Nachrichten'
empty: 'Von dir gesendete Nachrichten erscheinen hier.'
recipients: '{count} Empfänger | {count} Empfänger | {count} Empfänger'
action:
  reuse: 'Als Vorlage verwenden'
  delete: 'Löschen'
  close: 'Schließen'
dialog:
  delete:
    title: 'Nachricht löschen'
    message: 'Diese gesendete Nachricht aus dem Verlauf löschen? Bereits zugestellte E-Mails sind nicht betroffen.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Messages envoyés'
empty: 'Les messages que vous envoyez apparaissent ici.'
recipients: '{count} destinataire | {count} destinataire | {count} destinataires'
action:
  reuse: 'Utiliser comme modèle'
  delete: 'Supprimer'
  close: 'Fermer'
dialog:
  delete:
    title: 'Supprimer le message'
    message: "Supprimer ce message envoyé de l'historique ? Les e-mails déjà livrés ne sont pas affectés."
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wysłane wiadomości'
empty: 'Wysłane przez Ciebie wiadomości pojawią się tutaj.'
recipients: '{count} odbiorca | {count} odbiorca | {count} odbiorców'
action:
  reuse: 'Użyj jako szablon'
  delete: 'Usuń'
  close: 'Zamknij'
dialog:
  delete:
    title: 'Usuń wiadomość'
    message: 'Usunąć tę wysłaną wiadomość z historii? Już dostarczone e-maile nie zostaną zmienione.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Odeslané zprávy'
empty: 'Zprávy, které odešlete, se zobrazí zde.'
recipients: '{count} příjemce | {count} příjemce | {count} příjemců'
action:
  reuse: 'Použít jako šablonu'
  delete: 'Smazat'
  close: 'Zavřít'
dialog:
  delete:
    title: 'Smazat zprávu'
    message: 'Smazat tuto odeslanou zprávu z historie? Již doručené e-maily nebudou ovlivněny.'
</i18n>
