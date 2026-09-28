<template>
  <div
    v-if="restricted"
    class="row items-center text-caption timeline-restricted-note q-px-lg q-pb-sm"
  >
    <q-icon
      name="lock"
      size="xs"
      class="q-mr-xs"
    />
    {{ t('restrictedNote') }}
  </div>

  <div
    v-if="loading"
    class="row justify-center q-py-lg"
  >
    <q-spinner
      color="primary"
      size="2em"
    />
  </div>

  <q-timeline
    v-else
    class="q-px-lg"
    color="primary"
  >
    <q-timeline-entry
      v-for="entry in entries"
      :key="entry.id"
      :color="entry.color"
      :icon="entry.icon"
      :subtitle="entry.subtitle"
      :title="entry.title"
    >
      <div
        v-if="entry.caption"
        class="text-caption timeline-label"
      >
        {{ entry.caption }}
      </div>
      <div
        v-if="entry.note"
        class="text-body2 q-mb-xs"
      >
        {{ entry.note }}
      </div>
      <!-- One row per address the email went to, each with its own status:
           a registration's addresses bounce independently. -->
      <div
        v-if="entry.recipients?.length"
        class="timeline-recipients q-mb-xs"
      >
        <div
          v-for="(recipient, index) in entry.recipients"
          :key="`${recipient.to}-${index}`"
          class="timeline-recipient text-caption"
          :class="{ 'timeline-recipient--bounced': recipient.bounced }"
        >
          <q-icon
            :name="recipient.bounced ? 'error_outline' : 'outgoing_mail'"
            size="14px"
          />
          <span class="ellipsis">{{ recipient.to }}</span>
          <span
            v-if="recipient.bounced"
            class="timeline-recipient__status"
          >
            · {{ t('bounced') }}
          </span>
          <q-tooltip
            v-if="recipient.bounceReason"
            max-width="320px"
          >
            {{ recipient.bounceReason }}
          </q-tooltip>
        </div>
      </div>
      <div
        v-if="entry.fields.length"
        class="q-mb-xs"
      >
        <div class="text-caption timeline-label q-mb-xs">
          {{ t('changedFields') }}
        </div>
        <div class="timeline-chips">
          <q-chip
            v-for="field in entry.fields"
            :key="field.path"
            dense
            size="sm"
            class="timeline-chip"
          >
            {{ field.label }}
            <q-tooltip>{{ field.path }}</q-tooltip>
          </q-chip>
        </div>
      </div>
      <div
        v-if="entry.actor"
        class="text-caption timeline-label"
      >
        {{ t('by', { actor: entry.actor }) }}
      </div>
      <div
        v-if="entry.message"
        class="row q-gutter-x-xs q-mt-xs"
      >
        <m-btn
          tonal
          primary
          dense
          no-caps
          size="sm"
          icon="drafts"
          :label="t('viewMessage')"
          @click="openMessage(entry.message)"
        />
        <!-- Neutral rather than primary: the secondary, consequential action
             shouldn't compete with viewing the message. -->
        <m-btn
          v-if="entry.resendable && canResend && currentAddresses.length"
          text
          dense
          no-caps
          size="sm"
          class="timeline-resend-btn"
          icon="forward_to_inbox"
          :label="t('resend.action')"
          :loading="resendingId === entry.message.id"
          @click="confirmResend(entry)"
        />
      </div>
    </q-timeline-entry>
  </q-timeline>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  AuditLogEntry,
  Message,
} from '@camp-registration/common/entities';
import { useAuditTimeline } from '@/composables/audit/auditTimeline';
import {
  useAuditLabels,
  useFormFieldLabels,
} from '@/composables/audit/auditLabels';
import {
  normalizeEmail,
  type ReceivedEmail,
  useRegistrationTimeline,
} from '@/composables/audit/registrationTimeline';
import { usePermissions } from '@/composables/permissions';
import { useAPIService } from '@/services/APIService';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import MessageDetailsDialog from '@/components/event/contact/MessageDetailsDialog.vue';
import ResendMessageDialog, {
  type ResendRecipient,
} from '@/components/event/table/dialogs/ResendMessageDialog.vue';

const { eventId, registrationId, createdAt } = defineProps<{
  eventId: string;
  registrationId: string;
  createdAt: string | undefined;
}>();

const { t, locale } = useI18n();
const { t: tGlobal } = useI18n({ useScope: 'global' });
const quasar = useQuasar();
const apiService = useAPIService();
const { can } = usePermissions();
const { formatDateTime, actorLabel } = useAuditTimeline();
const { fieldLabel, valueLabel } = useAuditLabels();
const formFieldLabels = useFormFieldLabels();
const { data: registrations } = storeToRefs(useRegistrationsStore());
const { data: event } = storeToRefs(useEventDetailsStore());

const { auditEntries, emails, loading, restricted, reloadEmails } =
  useRegistrationTimeline(eventId, registrationId);

const canResend = computed(() => can('event.messages.create'));
const resendingId = ref<string | null>(null);

// Resending renders the source again for the registration's current
// addresses, which may differ from the ones the original went to.
const currentAddresses = computed<string[]>(() => {
  const registration = registrations.value?.find(
    (r) => r.id === registrationId,
  );
  return [
    ...new Set(
      (registration?.computedData.emails ?? [])
        .map(normalizeEmail)
        .filter(Boolean),
    ),
  ];
});

// Only what the decision needs: which email, and who gets it. An address that
// bounced last time and is still on the registration is called out, since the
// resend will most likely fail there again.
function confirmResend(entry: TimelineEntry): void {
  const message = entry.message;
  if (!message) {
    return;
  }

  const bounced = new Set(
    (entry.recipients ?? [])
      .filter((recipient) => recipient.bounced)
      .map((recipient) => normalizeEmail(recipient.to)),
  );
  const recipients: ResendRecipient[] = currentAddresses.value.map(
    (address) => ({ address, bouncedLastTime: bounced.has(address) }),
  );

  quasar
    .dialog({
      component: ResendMessageDialog,
      componentProps: { subject: message.subject, recipients },
    })
    .onOk(() => void resend(message));
}

async function resend(message: Message): Promise<void> {
  resendingId.value = message.id;
  try {
    // `message.id` is the id of the group's first delivery.
    await apiService.resendRegistrationMessage(
      eventId,
      registrationId,
      message.id,
    );
    quasar.notify({ type: 'positive', message: t('resend.success') });
    scheduleEmailsReload();
  } catch {
    quasar.notify({ type: 'negative', message: t('resend.failed') });
  } finally {
    resendingId.value = null;
  }
}

// A resent email is queued, so its deliveries exist only once a worker has
// built it — reload a moment later instead of right away.
let reloadTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleEmailsReload(): void {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => void reloadEmails(), 3000);
}
onBeforeUnmount(() => clearTimeout(reloadTimer));

interface ChangedField {
  label: string;
  // The raw audit path, shown as the tooltip.
  path: string;
}

interface TimelineEntry {
  id: string;
  // ISO timestamp, for merging audit entries and emails into one timeline.
  at: string;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  fields: ChangedField[];
  actor: string | null;
  caption?: string;
  note?: string;
  recipients?: EmailRecipient[];
  message?: Message;
  resendable?: boolean;
}

interface EmailRecipient {
  to: string;
  bounced: boolean;
  bounceReason: string | null;
}

// Mirrors the status colors used in the dialog header / table cells.
const STATUS_COLORS: Record<string, string> = {
  ACCEPTED: 'positive',
  PENDING: 'info',
};

const formatAt = (timestamp: string): string =>
  formatDateTime(timestamp, locale.value, event.value?.timezone);

function openMessage(message: Message): void {
  quasar.dialog({
    component: MessageDetailsDialog,
    componentProps: {
      message,
      registrations: registrations.value ?? [],
    },
  });
}

function emailEntry({
  message,
  trigger,
  resendable,
}: ReceivedEmail): TimelineEntry {
  // Deliveries without an address predate per-address rows; nothing to show.
  const recipients = (message.recipients?.[0]?.deliveries ?? []).flatMap(
    ({ to, bouncedAt, bounceReason }): EmailRecipient[] =>
      to ? [{ to, bounced: !!bouncedAt, bounceReason }] : [],
  );
  const at = message.createdAt ?? '';

  return {
    id: `email-${message.id}`,
    at,
    title: trigger ? t('automatedEmail') : t('messageSent'),
    subtitle: at ? formatAt(at) : '',
    color: recipients.some((r) => r.bounced) ? 'negative' : 'info',
    icon: trigger ? 'schedule_send' : 'mail',
    fields: [],
    actor: message.sentBy?.name ?? null,
    ...(trigger
      ? { caption: valueLabel('messageTemplate', 'trigger', trigger) }
      : {}),
    note: message.subject,
    recipients,
    message,
    resendable,
  };
}

// An update splits into a status entry (titled with the new status) and a
// changed-fields entry, since the status is the most salient edit.
function fromAuditEntry(entry: AuditLogEntry): TimelineEntry[] {
  const shared = {
    at: entry.createdAt,
    subtitle: formatAt(entry.createdAt),
    actor: actorLabel(entry.actor, tGlobal('audit.deletedUser')),
    fields: [],
  };

  if (entry.action === 'created') {
    return [
      {
        ...shared,
        id: entry.id,
        title: t('created'),
        color: 'positive',
        icon: 'how_to_reg',
      },
    ];
  }
  if (entry.action === 'deleted') {
    return [
      {
        ...shared,
        id: entry.id,
        title: t('deleted'),
        color: 'negative',
        icon: 'delete',
      },
    ];
  }

  const entries: TimelineEntry[] = [];
  const status = entry.details?.values?.status;
  if (typeof status === 'string') {
    entries.push({
      ...shared,
      id: `${entry.id}-status`,
      title: valueLabel('registration', 'status', status),
      color: STATUS_COLORS[status] ?? 'warning',
      icon: 'swap_horiz',
    });
  }

  const fields = (entry.details?.changedFields ?? []).filter(
    (path) => path !== 'status',
  );
  if (fields.length > 0) {
    entries.push({
      ...shared,
      id: `${entry.id}-fields`,
      title: t('updated'),
      color: 'primary',
      icon: 'edit',
      fields: fields.map((path) => ({
        label: fieldLabel('registration', path, formFieldLabels.value),
        path,
      })),
    });
  }
  return entries;
}

// Registrations from before audit logging have no `created` entry.
const legacyCreatedEntry = computed<TimelineEntry[]>(() =>
  createdAt && !auditEntries.value.some((entry) => entry.action === 'created')
    ? [
        {
          id: 'legacy-created',
          at: createdAt,
          title: t('created'),
          subtitle: formatAt(createdAt),
          color: 'positive',
          icon: 'how_to_reg',
          fields: [],
          actor: null,
        },
      ]
    : [],
);

// Newest first, audit entries and emails interleaved.
const entries = computed<TimelineEntry[]>(() =>
  [
    ...auditEntries.value.flatMap(fromAuditEntry),
    ...emails.value.map(emailEntry),
    ...legacyCreatedEntry.value,
  ].sort((a, b) => b.at.localeCompare(a.at)),
);
</script>

<style scoped>
.timeline-label {
  color: var(--md3-on-surface-variant);
}

.timeline-resend-btn {
  color: var(--md3-on-surface-variant);
}

.timeline-recipients {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-recipient {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  color: var(--md3-on-surface-variant);
}

.timeline-recipient--bounced {
  color: var(--md3-error);
}

.timeline-recipient__status {
  flex-shrink: 0;
  font-weight: 500;
}

.timeline-restricted-note {
  color: var(--md3-on-surface-variant);
}

/* Long question labels wrap rather than truncate; the raw path stays in the tooltip. */
.timeline-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.timeline-chip {
  max-width: 100%;
  height: auto;
  margin: 0;
}

.timeline-chip :deep(.q-chip__content) {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.25;
  padding-block: 3px;
}
</style>

<i18n lang="yaml" locale="en">
created: 'Registered'
updated: 'Updated'
deleted: 'Deleted'
by: 'by {actor}'
changedFields: 'Changed:'
messageSent: 'Message sent'
automatedEmail: 'Automated email sent'
viewMessage: 'View message'
bounced: 'Not delivered'
restrictedNote: "Some entries aren't shown — you don't have permission to view all of them"
resend:
  action: 'Send again'
  success: 'Email is being sent'
  failed: "The email couldn't be sent"
</i18n>

<i18n lang="yaml" locale="de">
created: 'Angemeldet'
updated: 'Aktualisiert'
deleted: 'Gelöscht'
by: 'von {actor}'
changedFields: 'Geändert:'
messageSent: 'Nachricht gesendet'
automatedEmail: 'Automatische E-Mail gesendet'
viewMessage: 'Nachricht ansehen'
bounced: 'Nicht zugestellt'
restrictedNote: 'Einige Einträge werden nicht angezeigt — dir fehlt die Berechtigung, alle anzusehen'
resend:
  action: 'Erneut senden'
  success: 'E-Mail wird gesendet'
  failed: 'Die E-Mail konnte nicht gesendet werden'
</i18n>

<i18n lang="yaml" locale="fr">
created: 'Inscrit'
updated: 'Mis à jour'
deleted: 'Supprimé'
by: 'par {actor}'
changedFields: 'Modifié :'
messageSent: 'Message envoyé'
automatedEmail: 'E-mail automatique envoyé'
viewMessage: 'Voir le message'
bounced: 'Non distribué'
restrictedNote: "Certaines entrées ne sont pas affichées — vous n'avez pas la permission de toutes les voir"
resend:
  action: 'Renvoyer'
  success: "L'e-mail est en cours d'envoi"
  failed: "L'e-mail n'a pas pu être envoyé"
</i18n>

<i18n lang="yaml" locale="pl">
created: 'Zarejestrowano'
updated: 'Zaktualizowano'
deleted: 'Usunięto'
by: 'przez {actor}'
changedFields: 'Zmieniono:'
messageSent: 'Wysłano wiadomość'
automatedEmail: 'Wysłano automatyczny e-mail'
viewMessage: 'Zobacz wiadomość'
bounced: 'Nie dostarczono'
restrictedNote: 'Niektóre wpisy nie są wyświetlane — nie masz uprawnień, aby zobaczyć wszystkie'
resend:
  action: 'Wyślij ponownie'
  success: 'E-mail jest wysyłany'
  failed: 'Nie udało się wysłać e-maila'
</i18n>

<i18n lang="yaml" locale="cs">
created: 'Zaregistrováno'
updated: 'Aktualizováno'
deleted: 'Smazáno'
by: 'uživatelem {actor}'
changedFields: 'Změněno:'
messageSent: 'Zpráva odeslána'
automatedEmail: 'Automatický e-mail odeslán'
viewMessage: 'Zobrazit zprávu'
bounced: 'Nedoručeno'
restrictedNote: 'Některé záznamy nejsou zobrazeny — nemáte oprávnění zobrazit vše'
resend:
  action: 'Odeslat znovu'
  success: 'E-mail se odesílá'
  failed: 'E-mail se nepodařilo odeslat'
</i18n>
