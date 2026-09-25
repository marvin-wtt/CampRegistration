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
      <div
        v-for="warning in entry.warnings"
        :key="warning"
        class="text-caption timeline-warning q-mb-xs"
      >
        {{ warning }}
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
      <m-btn
        v-if="entry.message"
        text
        primary
        dense
        no-caps
        size="sm"
        class="q-mt-xs"
        :label="t('viewMessage')"
        @click="openMessage(entry.message)"
      />
    </q-timeline-entry>
  </q-timeline>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
  type ReceivedEmail,
  useRegistrationTimeline,
} from '@/composables/audit/registrationTimeline';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import MessageDetailsDialog from '@/components/event/contact/MessageDetailsDialog.vue';

const { eventId, registrationId, createdAt } = defineProps<{
  eventId: string;
  registrationId: string;
  createdAt: string | undefined;
}>();

const { t, locale } = useI18n();
const { t: tGlobal } = useI18n({ useScope: 'global' });
const quasar = useQuasar();
const { formatDateTime, actorLabel } = useAuditTimeline();
const { fieldLabel, valueLabel } = useAuditLabels();
const formFieldLabels = useFormFieldLabels();
const { data: registrations } = storeToRefs(useRegistrationsStore());
const { data: event } = storeToRefs(useEventDetailsStore());

const { auditEntries, emails, loading, restricted } = useRegistrationTimeline(
  eventId,
  registrationId,
);

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
  warnings?: string[];
  message?: Message;
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

function emailEntry({ message, trigger }: ReceivedEmail): TimelineEntry {
  const warnings = (message.recipients?.[0]?.deliveries ?? [])
    .filter((delivery) => delivery.bouncedAt)
    .map((delivery) => t('bounced', { to: delivery.to ?? '—' }));
  const at = message.createdAt ?? '';

  return {
    id: `email-${message.id}`,
    at,
    title: trigger ? t('automatedEmail') : t('messageSent'),
    subtitle: at ? formatAt(at) : '',
    color: warnings.length > 0 ? 'negative' : 'info',
    icon: trigger ? 'schedule_send' : 'mail',
    fields: [],
    actor: message.sentBy?.name ?? null,
    ...(trigger
      ? { caption: valueLabel('messageTemplate', 'trigger', trigger) }
      : {}),
    note: message.subject,
    warnings,
    message,
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

.timeline-warning {
  color: var(--md3-error);
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
bounced: 'Not delivered to {to}'
restrictedNote: "Some entries aren't shown — you don't have permission to view all of them"
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
bounced: 'Nicht zugestellt an {to}'
restrictedNote: 'Einige Einträge werden nicht angezeigt — dir fehlt die Berechtigung, alle anzusehen'
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
bounced: 'Non distribué à {to}'
restrictedNote: "Certaines entrées ne sont pas affichées — vous n'avez pas la permission de toutes les voir"
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
bounced: 'Nie dostarczono do {to}'
restrictedNote: 'Niektóre wpisy nie są wyświetlane — nie masz uprawnień, aby zobaczyć wszystkie'
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
bounced: 'Nedoručeno na {to}'
restrictedNote: 'Některé záznamy nejsou zobrazeny — nemáte oprávnění zobrazit vše'
</i18n>
