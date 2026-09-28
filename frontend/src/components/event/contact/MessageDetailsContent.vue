<template>
  <article class="message-details">
    <header class="message-header">
      <div class="message-subject">{{ message.subject }}</div>

      <dl class="message-meta">
        <template v-if="message.sentBy">
          <dt>{{ t('from') }}</dt>
          <dd class="message-meta__row">
            <span class="message-meta__text">
              {{ message.sentBy.name ?? '—' }}
            </span>
            <span
              v-if="message.createdAt"
              class="message-meta__date"
            >
              {{ d(message.createdAt, 'dateTime') }}
            </span>
          </dd>
        </template>

        <dt>{{ t('to') }}</dt>
        <dd class="message-meta__row">
          <div class="message-chips message-chips--recipients">
            <q-chip
              v-for="entry in recipientEntries"
              :key="entry.key"
              dense
              :icon="entry.bounced ? 'error_outline' : undefined"
              class="message-chip"
              :class="{ 'message-chip--bounced': entry.bounced }"
            >
              {{ entry.name }}
              <q-tooltip v-if="entry.emails.length > 0">
                <div
                  v-for="(email, index) in entry.emails"
                  :key="`${email.address}-${index}`"
                >
                  {{ email.address }}
                  <template v-if="email.bounced">
                    — {{ t('bounced') }}
                    <template v-if="email.bounceReason">
                      ({{ email.bounceReason }})
                    </template>
                  </template>
                </div>
              </q-tooltip>
            </q-chip>
          </div>
          <span
            v-if="!message.sentBy && message.createdAt"
            class="message-meta__date"
          >
            {{ d(message.createdAt, 'dateTime') }}
          </span>
        </dd>

        <template v-if="message.replyTo">
          <dt>{{ t('replyTo') }}</dt>
          <dd class="message-meta__text">{{ message.replyTo }}</dd>
        </template>

        <template v-if="message.attachments?.length">
          <dt>{{ t('attachments') }}</dt>
          <dd class="message-chips">
            <q-chip
              v-for="file in message.attachments"
              :key="file.id"
              clickable
              dense
              icon="attach_file"
              class="message-chip message-chip--file"
              @click="openAttachment(file)"
            >
              {{ file.name }}
              <q-tooltip>{{ t('action.view') }}</q-tooltip>
            </q-chip>
          </dd>
        </template>
      </dl>
    </header>

    <div
      class="message-body rounded-lg"
      :class="{ 'message-body--document': isDocument }"
      v-html="bodyHtml"
    />
  </article>
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

// A delivery stores the whole rendered email, layout included, which brings
// its own spacing and background — only a bare body needs the viewer's.
const isDocument = computed<boolean>(() =>
  /^\s*(<!doctype|<html[\s>])/i.test(message.body),
);

interface RecipientEmailEntry {
  address: string;
  bounced: boolean;
  bounceReason: string | null;
}

interface RecipientEntry {
  key: string;
  name: string;
  emails: RecipientEmailEntry[];
  bounced: boolean;
}

const recipientEntries = computed<RecipientEntry[]>(() => {
  return (message.recipients ?? []).map((recipient, index) => {
    const registration = registrationsById.value.get(recipient.registrationId);
    const name = registration
      ? formatPersonName(fullName(registration))
      : undefined;

    // Delivery rows record what was actually sent, so they decide which
    // addresses are shown — an address since changed on the registration
    // still belongs here, carrying its failure. The registration's current
    // addresses only stand in when no delivery has a `to`, as right after a
    // send, before the per-email rows exist.
    const deliveredEntries: RecipientEmailEntry[] =
      recipient.deliveries.flatMap((delivery) => {
        if (delivery.to) {
          return [
            {
              address: delivery.to,
              bounced: Boolean(delivery.bouncedAt),
              bounceReason: delivery.bounceReason,
            },
          ];
        }
        return [];
      });

    const emailEntries: RecipientEmailEntry[] =
      deliveredEntries.length > 0
        ? deliveredEntries
        : (registration ? emails(registration) : []).map((address) => ({
            address,
            bounced: false,
            bounceReason: null,
          }));

    return {
      key: `${recipient.registrationId}-${index}`,
      name: name ?? emailEntries[0]?.address ?? recipient.registrationId,
      emails: emailEntries,
      bounced: emailEntries.some((entry) => entry.bounced),
    };
  });
});

function openAttachment(file: ServiceFile) {
  window.open(apiService.getFileUrl(file.id), '_blank', 'noopener');
}
</script>

<style scoped>
.message-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-subject {
  margin-bottom: 12px;
  color: var(--md3-on-surface);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

/* Label column sized to the longest label, values filling the rest. */
.message-meta {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 16px;
  row-gap: 8px;
  /* Labels line up with the first row of a wrapping chip list. */
  align-items: start;
  margin: 0;
  font-size: 14px;
  line-height: 24px;
}

.message-meta dt {
  color: var(--md3-on-surface-variant);
}

.message-meta dd {
  margin: 0;
  min-width: 0;
}

.message-meta__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.message-meta__text {
  color: var(--md3-on-surface);
  overflow-wrap: anywhere;
}

.message-meta__date {
  flex-shrink: 0;
  color: var(--md3-on-surface-variant);
  font-size: 12px;
  white-space: nowrap;
}

.message-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.message-chips--recipients {
  max-height: 112px;
  overflow-y: auto;
}

.message-chip {
  margin: 0;
  border-radius: 8px;
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.message-chip--bounced {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.message-chip--file {
  border: 1px solid var(--md3-outline-variant);
  background: transparent;
  color: var(--md3-on-surface);
}

.message-body {
  padding: 20px 24px;
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface);
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.message-body--document {
  padding: 0;
  overflow: hidden;
  line-height: normal;
}

.message-body:not(.message-body--document) :deep(p) {
  margin: 0 0 0.75em;
}

.message-body:not(.message-body--document) :deep(p:last-child) {
  margin-bottom: 0;
}

.message-body:not(.message-body--document) :deep(ul),
.message-body:not(.message-body--document) :deep(ol) {
  padding-left: 1.5em;
  margin: 0 0 0.75em;
}

.message-body:not(.message-body--document) :deep(a) {
  color: var(--md3-primary);
}
</style>

<i18n lang="yaml" locale="en">
from: 'From'
to: 'To'
replyTo: 'Reply to'
attachments: 'Attachments'
bounced: 'Bounced'
action:
  view: 'Open'
</i18n>

<i18n lang="yaml" locale="de">
from: 'Von'
to: 'An'
replyTo: 'Antwort an'
attachments: 'Anhänge'
bounced: 'Unzustellbar'
action:
  view: 'Öffnen'
</i18n>

<i18n lang="yaml" locale="fr">
from: 'De'
to: 'À'
replyTo: 'Répondre à'
attachments: 'Pièces jointes'
bounced: 'Non distribué'
action:
  view: 'Ouvrir'
</i18n>

<i18n lang="yaml" locale="pl">
from: 'Od'
to: 'Do'
replyTo: 'Odpowiedź do'
attachments: 'Załączniki'
bounced: 'Niedostarczono'
action:
  view: 'Otwórz'
</i18n>

<i18n lang="yaml" locale="cs">
from: 'Od'
to: 'Komu'
replyTo: 'Odpovědět na'
attachments: 'Přílohy'
bounced: 'Nedoručeno'
action:
  view: 'Otevřít'
</i18n>
