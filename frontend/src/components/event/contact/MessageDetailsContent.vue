<template>
  <div class="q-gutter-y-md">
    <div>
      <div class="text-subtitle1 text-weight-medium">
        {{ message.subject }}
      </div>
      <div class="text-caption text-grey-6">
        {{ message.createdAt ? d(message.createdAt, 'dateTime') : '' }}
      </div>
      <div
        v-if="message.sentBy"
        class="text-caption text-grey-6 row items-center q-gutter-xs no-wrap"
      >
        <q-icon
          name="person"
          size="14px"
        />
        <span>
          {{ t('sentBy', { name: message.sentBy.name ?? '' }) }}
        </span>
      </div>
    </div>

    <!-- Reply-to -->
    <div v-if="message.replyTo">
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
        {{ message.replyTo }}
      </q-chip>
    </div>

    <!-- Recipients -->
    <div>
      <div class="text-caption text-grey-7 q-mb-xs">
        {{ t('recipients', { count: recipientCount }) }}
      </div>
      <div class="recipient-chips row q-gutter-xs">
        <q-chip
          v-for="entry in recipientEntries"
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
      v-if="message.attachments?.length"
      class="row items-center q-gutter-xs"
    >
      <q-chip
        v-for="file in message.attachments"
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
      v-html="bodyHtml"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DOMPurify from 'dompurify';
import type {
  Message,
  Registration,
  ServiceFile,
} from '@camp-registration/common/entities';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { formatPersonName } from '@/utils/formatters';
import { useAPIService } from '@/services/APIService';

const { message, registrations } = defineProps<{
  message: Message;
  registrations: Registration[];
}>();

const { t, d } = useI18n();
const apiService = useAPIService();
const { fullName, emails } = useRegistrationHelper();

const registrationsById = computed(
  () => new Map(registrations.map((r) => [r.id, r])),
);

// Only the open message is sanitized, so a list of messages scales without
// parsing every body up front.
const bodyHtml = computed<string>(() => DOMPurify.sanitize(message.body));

const recipientCount = computed<number>(() => message.recipients?.length ?? 0);

interface RecipientEntry {
  key: string;
  name: string;
  emails: string[];
}

const recipientEntries = computed<RecipientEntry[]>(() =>
  (message.recipients ?? []).map((recipient, index) => {
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
  }),
);

function openAttachment(file: ServiceFile) {
  window.open(apiService.getFileUrl(file.id), '_blank', 'noopener');
}
</script>

<style scoped>
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
</style>

<i18n lang="yaml" locale="en">
sentBy: 'Sent by {name}'
replyTo: 'Reply-to'
recipients: '{count} recipient | {count} recipient | {count} recipients'
action:
  view: 'Open'
</i18n>

<i18n lang="yaml" locale="de">
sentBy: 'Gesendet von {name}'
replyTo: 'Antwort an'
recipients: '{count} Empfänger | {count} Empfänger | {count} Empfänger'
action:
  view: 'Öffnen'
</i18n>

<i18n lang="yaml" locale="fr">
sentBy: 'Envoyé par {name}'
replyTo: 'Répondre à'
recipients: '{count} destinataire | {count} destinataire | {count} destinataires'
action:
  view: 'Ouvrir'
</i18n>

<i18n lang="yaml" locale="pl">
sentBy: 'Wysłane przez {name}'
replyTo: 'Odpowiedź do'
recipients: '{count} odbiorca | {count} odbiorca | {count} odbiorców'
action:
  view: 'Otwórz'
</i18n>

<i18n lang="yaml" locale="cs">
sentBy: 'Odeslal {name}'
replyTo: 'Odpovědět na'
recipients: '{count} příjemce | {count} příjemce | {count} příjemců'
action:
  view: 'Otevřít'
</i18n>
