<template>
  <page-state-handler
    padding
    :loading="loading && !retention"
    :error
    class="row justify-center"
  >
    <!-- Everything irreversible about an event's data in one place, out of
         everyday paths (docs/privacy.md, 8). -->
    <div
      class="data-shell column no-wrap col-12 col-sm-10 col-md-8 q-gutter-md"
    >
      <page-header
        :title="t('title')"
        :subtitle="t('subtitle')"
      />

      <!-- Periods: where the deadlines come from. -->
      <privacy-section
        icon="schedule"
        :title="t('periods.title')"
        :summary="t('periods.summary')"
      >
        <template v-if="retention?.periods.registrations">
          <div class="text-body2">
            {{
              t('periods.registrations', {
                months: retention.periods.registrations.months,
                anchor: gt(
                  `privacy.retentionAnchor.${retention.periods.registrations.anchor}`,
                ),
              })
            }}
          </div>
          <div
            v-if="retention.periods.sensitive"
            class="text-body2 q-mt-xs"
          >
            {{
              t('periods.sensitive', {
                weeks: retention.periods.sensitive.weeks,
                anchor: gt(
                  `privacy.retentionAnchor.${retention.periods.sensitive.anchor}`,
                ),
              })
            }}
          </div>
        </template>
        <div
          v-else
          class="text-body2 text-on-surface-variant"
        >
          {{ t('periods.none') }}
        </div>

        <template
          v-if="event"
          #actions
        >
          <m-btn
            :label="t('periods.edit')"
            icon="open_in_new"
            text
            primary
            no-caps
            :to="{
              name: 'management.organization.privacy',
              params: { organizationId: event.organizationId },
            }"
          />
        </template>
      </privacy-section>

      <!-- Deleting registration data: always possible, deadline or not. -->
      <privacy-section
        icon="auto_delete"
        :title="t('delete.title')"
        :summary="t('delete.summary')"
        danger
      >
        <!-- Deleting early is allowed but rarely meant: say what it costs. -->
        <div
          v-if="canDeleteData && earlyWarnings.length > 0"
          class="danger-note bg-error-container text-on-error-container rounded-lg q-mb-sm"
          data-test="retention-early"
        >
          <q-icon
            name="schedule"
            size="20px"
          />
          <div>
            <div
              v-for="warning in earlyWarnings"
              :key="warning"
            >
              {{ t(`early.${warning}`) }}
            </div>
          </div>
        </div>

        <div
          v-if="canDeleteData && rows.some((row) => !row.purged)"
          class="danger-note bg-error-container text-on-error-container rounded-lg q-mb-md"
        >
          <q-icon
            name="warning"
            size="20px"
          />
          <span>{{ t('delete.preserve') }}</span>
        </div>

        <div class="column data-rows">
          <div
            v-for="row in rows"
            :key="row.kind"
            class="data-row rounded-lg"
            :class="{ 'data-row--purged': row.purged }"
            :data-test="`retention-${row.kind}`"
          >
            <div class="row items-center no-wrap q-gutter-x-sm">
              <div class="col text-body1 text-weight-medium">
                {{ t(`kind.${row.kind}`) }}
              </div>
              <q-chip
                v-if="row.status"
                dense
                square
                class="status-chip"
                :color="STATUS_COLORS[row.status].color"
                :text-color="STATUS_COLORS[row.status].textColor"
                :label="t(`status.${row.status}`)"
              />
            </div>

            <div
              v-if="!row.purged"
              class="text-body2 text-on-surface-variant q-mt-xs"
            >
              {{ t(`effect.${row.kind}`) }}
            </div>

            <div
              v-if="row.deadline?.postponement?.reason"
              class="text-caption text-on-surface-variant q-mt-xs"
            >
              {{
                t('postponedBy', {
                  name: row.deadline.postponement.postponedBy ?? '—',
                  reason: row.deadline.postponement.reason,
                })
              }}
            </div>

            <div class="data-row__footer">
              <div class="data-row__date text-caption">
                <q-icon
                  :name="row.purged ? 'check_circle' : 'event'"
                  size="16px"
                />
                {{ row.dateLine }}
              </div>
              <div
                v-if="canDeleteData && !row.purged"
                class="data-row__actions"
              >
                <m-btn
                  v-if="row.deadline"
                  :label="t('action.postpone')"
                  icon="event_repeat"
                  text
                  primary
                  no-caps
                  :data-test="`retention-postpone-${row.kind}`"
                  @click="postpone(row.deadline)"
                />
                <m-btn
                  :label="t(`action.delete.${row.kind}`)"
                  icon="delete_forever"
                  error
                  no-caps
                  :data-test="`retention-delete-${row.kind}`"
                  @click="purge(row.kind)"
                />
              </div>
            </div>
          </div>
        </div>
        <p class="text-caption text-on-surface-variant q-mt-md q-mb-none">
          {{ t('delete.noAutomaticDeletion') }}
        </p>
      </privacy-section>

      <!-- Deleting the event itself. -->
      <privacy-section
        v-if="can('event.delete')"
        icon="delete"
        :title="t('event.title')"
        :summary="t('event.summary')"
        danger
      >
        <div
          class="danger-note bg-error-container text-on-error-container rounded-lg q-mb-md"
        >
          <q-icon
            name="warning"
            size="20px"
          />
          <span>{{ t('event.preserve') }}</span>
        </div>

        <div class="text-body2 text-weight-medium q-mb-sm">
          {{ t('event.removes') }}
        </div>
        <div class="event-effects">
          <div
            v-for="effect in EVENT_EFFECTS"
            :key="effect.key"
            class="event-effect rounded-lg"
          >
            <q-icon
              :name="effect.icon"
              color="error"
              size="20px"
            />
            <span class="text-body2">{{
              t(`event.effect.${effect.key}`)
            }}</span>
          </div>
        </div>
        <div class="text-body2 text-on-surface-variant q-mt-md">
          {{ t('event.after') }}
        </div>

        <div class="text-body2 text-weight-medium q-mt-md q-mb-xs">
          {{ t('event.keepsTitle') }}
        </div>
        <ul class="text-body2 text-on-surface-variant event-keeps">
          <li
            v-for="key in EVENT_KEEPS"
            :key="key"
          >
            {{ t(`event.keeps.${key}`) }}
          </li>
        </ul>

        <div class="row justify-end q-mt-md">
          <m-btn
            :label="t('event.action')"
            icon="delete_forever"
            error
            no-caps
            data-test="event-delete"
            @click="deleteEvent"
          />
        </div>
      </privacy-section>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  EventRetention,
  RetentionDeadline,
  RetentionDeadlineKind,
  RetentionDeadlineStatus,
  RetentionPostponeData,
} from '@camp-registration/common/privacy';
import PageHeader from '@/components/common/PageHeader.vue';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import PrivacySection from '@/components/privacy/PrivacySection.vue';
import RetentionPostponeDialog from '@/components/retention/RetentionPostponeDialog.vue';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import { useRetentionService } from '@/services/RetentionService';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useEventsStore } from '@/stores/events-store';
import { usePermissions } from '@/composables/permissions';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useAction } from '@/composables/action';

const { t, d } = useI18n();
const { t: gt } = useI18n({ useScope: 'global' });
const quasar = useQuasar();
const router = useRouter();
const { to } = useObjectTranslation();
const { can } = usePermissions();
const { run } = useAction();
const service = useRetentionService();
const eventDetailsStore = useEventDetailsStore();
const eventsStore = useEventsStore();
const { data: event } = storeToRefs(eventDetailsStore);

const retention = ref<EventRetention | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const canDeleteData = computed(() => can('event.registrations.delete'));

void eventDetailsStore.fetchData();

async function load(eventId: string) {
  loading.value = true;
  try {
    retention.value = await service.fetchEventRetention(eventId);
    error.value = null;
  } catch {
    error.value = t('request.load.error');
  } finally {
    loading.value = false;
  }
}

watch(
  () => event.value?.id,
  (id) => {
    if (id) {
      void load(id);
    }
  },
  { immediate: true },
);

// What deleting an event takes with it, in the order a manager would miss it.
// Keep in sync with the event's cascading relations (`model Event` in
// backend/prisma/schema.prisma): a feature added or removed must be added or
// removed here, with its text in all five locales.
const EVENT_EFFECTS = [
  { key: 'registrations', icon: 'groups' },
  { key: 'finances', icon: 'payments' },
  { key: 'files', icon: 'folder' },
  { key: 'planning', icon: 'event_note' },
  { key: 'messages', icon: 'mail' },
  { key: 'access', icon: 'key' },
] as const;

// The only things that outlive the event; keep in sync like the list above.
const EVENT_KEEPS = ['newsletter', 'audit', 'outside'] as const;

/** Why deleting now would be early: registration still possible, event on. */
const earlyWarnings = computed<('registration' | 'event')[]>(() => {
  const current = event.value;
  if (!current || current.registrationDataPurgedAt) {
    return [];
  }
  return [
    ...(current.registrationStatus !== 'closed'
      ? (['registration'] as const)
      : []),
    ...(new Date(current.endAt) > new Date() ? (['event'] as const) : []),
  ];
});

interface Row {
  kind: RetentionDeadlineKind;
  deadline: RetentionDeadline | null;
  status: RetentionDeadlineStatus | null;
  purged: boolean;
  dateLine: string;
}

function purgedAt(kind: RetentionDeadlineKind): string | null {
  const current = event.value;
  if (!current) {
    return null;
  }
  return kind === 'sensitive'
    ? (current.sensitiveDataPurgedAt ?? current.registrationDataPurgedAt)
    : current.registrationDataPurgedAt;
}

/** Without a deadline yet: what the current notice would give. */
function estimate(kind: RetentionDeadlineKind): string {
  const periods = retention.value?.periods;
  const endAt = event.value?.endAt;
  const period =
    kind === 'sensitive' ? periods?.sensitive : periods?.registrations;
  if (!period || !endAt) {
    return t('date.unknown');
  }
  if (period.anchor !== 'event_end') {
    return t('date.afterSubmission');
  }
  const date = new Date(endAt);
  if ('months' in period) {
    date.setMonth(date.getMonth() + period.months);
  } else {
    date.setDate(date.getDate() + period.weeks * 7);
  }
  return t('date.estimate', { date: d(date, 'date') });
}

const rows = computed<Row[]>(() => {
  const deadlines = retention.value?.deadlines ?? [];
  // The sensitive row only where the form asks something sensitive.
  const kinds: RetentionDeadlineKind[] = [
    ...(retention.value?.periods.sensitive ||
    deadlines.some((entry) => entry.kind === 'sensitive')
      ? (['sensitive'] as const)
      : []),
    'registrations',
  ];

  return kinds.map((kind) => {
    const deadline = deadlines.find((entry) => entry.kind === kind) ?? null;
    const purged = purgedAt(kind);

    let dateLine: string;
    if (purged) {
      dateLine = t('date.deleted', { date: d(purged, 'date') });
    } else if (deadline?.postponement) {
      dateLine = t('date.postponed', {
        date: d(deadline.postponement.until, 'date'),
        original: d(deadline.dueAt, 'date'),
      });
    } else if (deadline) {
      dateLine = t('date.due', { date: d(deadline.dueAt, 'date') });
    } else {
      dateLine = estimate(kind);
    }

    return {
      kind,
      deadline,
      status: purged ? 'resolved' : (deadline?.status ?? null),
      purged: !!purged,
      dateLine,
    };
  });
});

/** The general deadline caps the sensitive one: it holds a subset. */
function latestFor(deadline: RetentionDeadline): string | null {
  if (deadline.kind !== 'sensitive') {
    return null;
  }
  const general = retention.value?.deadlines.find(
    (entry) => entry.kind === 'registrations' && entry.status !== 'resolved',
  );
  return general ? general.effectiveAt.slice(0, 10) : null;
}

function postpone(deadline: RetentionDeadline) {
  const eventId = event.value?.id;
  if (!eventId) {
    return;
  }
  quasar
    .dialog({
      component: RetentionPostponeDialog,
      componentProps: { latest: latestFor(deadline) },
    })
    .onOk((data: RetentionPostponeData) => {
      void run(
        'postpone',
        async () => {
          retention.value = await service.postponeDeadline(
            eventId,
            deadline.kind,
            data,
          );
        },
        { feedback: 'result' },
      ).catch(() => undefined);
    });
}

function purge(kind: RetentionDeadlineKind) {
  const current = event.value;
  if (!current) {
    return;
  }
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t(`purge.${kind}`),
        message: t('purge.irreversible'),
        value: to(current.name),
        label: t('purge.label'),
      },
      persistent: true,
    })
    .onOk(() => {
      void run(
        'purge',
        async () => {
          await service.purge(current.id, kind);
          await Promise.allSettled([
            load(current.id),
            eventDetailsStore.fetchData(current.id),
          ]);
        },
        { feedback: 'progress' },
      ).catch(() => undefined);
    });
}

function deleteEvent() {
  const current = event.value;
  if (!current) {
    return;
  }
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('event.dialog.title'),
        message: t('purge.irreversible'),
        value: to(current.name),
        label: t('purge.label'),
      },
      persistent: true,
    })
    .onOk(() => {
      void eventsStore
        .deleteEntry(current.id)
        .then(() => router.push({ name: 'management.events' }))
        .catch(() => undefined);
    });
}

// Status chip colours by MD3 role.
const STATUS_COLORS: Record<
  RetentionDeadlineStatus,
  { color: string; textColor: string }
> = {
  upcoming: {
    color: 'surface-container-highest',
    textColor: 'on-surface-variant',
  },
  due_soon: { color: 'warning-container', textColor: 'on-warning-container' },
  overdue: { color: 'error-container', textColor: 'on-error-container' },
  resolved: {
    color: 'positive-container',
    textColor: 'on-positive-container',
  },
};
</script>

<style lang="scss" scoped>
.data-shell {
  max-width: 48rem;
}

.data-rows {
  gap: 0.5rem;
}

.data-row {
  padding: 0.875rem 1rem;
  background-color: var(--md3-surface-container);
}

.data-row--purged {
  opacity: 0.75;
}

.data-row__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.data-row__date {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--md3-on-surface-variant);
}

.data-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-left: auto;
}

.danger-note {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}

.event-keeps {
  margin: 0;
  padding-left: 1.25rem;
}

.event-effects {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.5rem;
}

.event-effect {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background-color: var(--md3-surface-container);
}

.status-chip {
  margin: 0;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Data & deletion'
subtitle: 'How long this event keeps registration data, and deleting it.'
periods:
  title: 'Retention periods'
  summary: 'Set in your organisation’s privacy notice. Each registration keeps the periods it was shown.'
  registrations: 'Registration data: {months} months {anchor}'
  sensitive: 'Health and other sensitive details: {weeks} weeks {anchor}'
  none: 'The privacy notice states no period.'
  edit: 'Change in the organisation’s privacy settings'
delete:
  preserve: 'Before deleting, keep a copy of anything you are legally required to retain, such as invoices or records for a funding body, for example by exporting it.'
  title: 'Delete registration data'
  summary: 'Possible at any time. Sensitive data is part of the registration data.'
  noAutomaticDeletion: 'Nothing is deleted automatically.'
event:
  preserve: 'Export the finances and anything else you are legally required to keep, such as receipts, payouts or registration records for a funding body, before deleting the event.'
  removes: 'Everything that belongs to the event is deleted for good, for example:'
  keepsTitle: 'Only these remain:'
  keeps:
    newsletter: 'newsletter subscribers imported from its registrations, in the organisation’s newsletter'
    audit: 'the activity log for up to two years, without any answers'
    outside: 'emails already sent and data already exported, outside this platform'
  after: 'The public page and registration link stop working, and the event can no longer be used as a template.'
  effect:
    registrations: 'all registrations, including sensitive data'
    finances: 'the finances: expenses, receipts and payouts'
    files: 'all files of the event'
    planning: 'rooms, program, tasks and duty plans'
    messages: 'sent messages and email templates'
    access: 'the access of all managers'
  title: 'Delete event'
  summary: 'The event and everything that belongs to it.'
  action: 'Delete event'
  dialog:
    title: 'Delete event?'
kind:
  sensitive: 'Health and other sensitive details'
  registrations: 'All registration data'
status:
  upcoming: 'Upcoming'
  due_soon: 'Due soon'
  overdue: 'Overdue'
  resolved: 'Deleted'
date:
  due: 'Delete by {date}'
  postponed: 'Postponed until {date} (originally {original})'
  deleted: 'Deleted on {date}'
  estimate: 'Expected deadline: {date}'
  afterSubmission: 'Deadline counted from each registration'
  unknown: 'No deadline'
postponedBy: 'Postponed by {name}: {reason}'
action:
  postpone: 'Postpone'
  delete:
    sensitive: 'Delete sensitive data'
    registrations: 'Delete all registrations'
request:
  load:
    error: 'Could not load the retention deadlines'
  postpone:
    error: 'Could not postpone the deadline'
    success: 'Deadline postponed'
  purge:
    progress: 'Deleting data…'
    error: 'Could not delete the data'
    success: 'Data deleted'
effect:
  sensitive: 'Deletes the answers to health and other sensitive questions in every registration, including files uploaded to them. The rest of each registration stays. New registrations are no longer possible afterwards.'
  registrations: 'Deletes every registration of this event with its files and sensitive data. Room assignments are freed. The event can never take registrations again.'
purge:
  label: 'event name'
  irreversible: 'This cannot be undone.'
  sensitive: 'Delete sensitive data?'
  registrations: 'Delete all registrations?'
early:
  registration: 'Registration is still open or scheduled. Deleting closes it immediately and for good.'
  event: 'The event has not ended yet. Data you need during it, such as health details, would be gone.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Daten & Löschung'
subtitle: 'Wie lange diese Veranstaltung Anmeldedaten aufbewahrt und wie du sie löschst.'
periods:
  title: 'Speicherfristen'
  summary: 'Festgelegt in den Datenschutzinformationen eurer Organisation. Jede Anmeldung behält die Fristen, die ihr gezeigt wurden.'
  registrations: 'Anmeldedaten: {months} Monate {anchor}'
  sensitive: 'Gesundheitsangaben und andere sensible Daten: {weeks} Wochen {anchor}'
  none: 'Die Datenschutzinformationen nennen keine Frist.'
  edit: 'In den Datenschutzeinstellungen der Organisation ändern'
delete:
  preserve: 'Sichere vor dem Löschen alles, was du gesetzlich aufbewahren musst, etwa Rechnungen oder Nachweise für Fördermittelgeber, zum Beispiel per Export.'
  title: 'Anmeldedaten löschen'
  summary: 'Jederzeit möglich. Sensible Daten sind Teil der Anmeldedaten.'
  noAutomaticDeletion: 'Es wird nichts automatisch gelöscht.'
event:
  preserve: 'Exportiere vor dem Löschen die Finanzen und alles, was du gesetzlich aufbewahren musst, etwa Belege, Auszahlungen oder Anmeldenachweise für Fördermittelgeber.'
  removes: 'Alles, was zur Veranstaltung gehört, wird endgültig gelöscht, zum Beispiel:'
  keepsTitle: 'Erhalten bleiben nur:'
  keeps:
    newsletter: 'aus den Anmeldungen importierte Newsletter-Abonnements, im Newsletter der Organisation'
    audit: 'das Aktivitätsprotokoll für bis zu zwei Jahre, ohne Antworten'
    outside: 'bereits gesendete E-Mails und exportierte Daten außerhalb dieser Plattform'
  after: 'Die öffentliche Seite und der Anmeldelink funktionieren nicht mehr, und die Veranstaltung kann nicht mehr als Vorlage genutzt werden.'
  effect:
    registrations: 'alle Anmeldungen, einschließlich sensibler Daten'
    finances: 'die Finanzen: Ausgaben, Belege und Auszahlungen'
    files: 'alle Dateien der Veranstaltung'
    planning: 'Zimmer, Programm, Aufgaben und Dienstpläne'
    messages: 'gesendete Nachrichten und E-Mail-Vorlagen'
    access: 'der Zugriff aller Verantwortlichen'
  title: 'Veranstaltung löschen'
  summary: 'Die Veranstaltung und alles, was dazu gehört.'
  action: 'Veranstaltung löschen'
  dialog:
    title: 'Veranstaltung löschen?'
kind:
  sensitive: 'Gesundheitsangaben und andere sensible Daten'
  registrations: 'Alle Anmeldedaten'
status:
  upcoming: 'Anstehend'
  due_soon: 'Bald fällig'
  overdue: 'Überfällig'
  resolved: 'Gelöscht'
date:
  due: 'Löschen bis {date}'
  postponed: 'Verschoben auf {date} (ursprünglich {original})'
  deleted: 'Gelöscht am {date}'
  estimate: 'Voraussichtliche Frist: {date}'
  afterSubmission: 'Frist zählt ab jeder Anmeldung'
  unknown: 'Keine Frist'
postponedBy: 'Verschoben von {name}: {reason}'
action:
  postpone: 'Verschieben'
  delete:
    sensitive: 'Sensible Daten löschen'
    registrations: 'Alle Anmeldungen löschen'
request:
  load:
    error: 'Die Speicherfristen konnten nicht geladen werden'
  postpone:
    error: 'Die Frist konnte nicht verschoben werden'
    success: 'Frist verschoben'
  purge:
    progress: 'Daten werden gelöscht…'
    error: 'Die Daten konnten nicht gelöscht werden'
    success: 'Daten gelöscht'
effect:
  sensitive: 'Löscht in allen Anmeldungen die Antworten auf Gesundheitsfragen und andere sensible Fragen, einschließlich dort hochgeladener Dateien. Der Rest der Anmeldungen bleibt. Neue Anmeldungen sind danach nicht mehr möglich.'
  registrations: 'Löscht alle Anmeldungen dieser Veranstaltung mit ihren Dateien und sensiblen Daten. Zimmerzuteilungen werden frei. Die Veranstaltung kann danach nie wieder Anmeldungen annehmen.'
purge:
  label: 'Veranstaltungsname'
  irreversible: 'Das kann nicht rückgängig gemacht werden.'
  sensitive: 'Sensible Daten löschen?'
  registrations: 'Alle Anmeldungen löschen?'
early:
  registration: 'Die Anmeldung ist noch offen oder geplant. Löschen schließt sie sofort und dauerhaft.'
  event: 'Die Veranstaltung ist noch nicht vorbei. Daten, die ihr währenddessen braucht, etwa Gesundheitsangaben, wären danach weg.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Données et suppression'
subtitle: 'Combien de temps cet événement conserve les données d’inscription, et leur suppression.'
periods:
  title: 'Durées de conservation'
  summary: 'Fixées dans les informations sur la protection des données de ton organisation. Chaque inscription garde les durées qui lui ont été présentées.'
  registrations: 'Données d’inscription : {months} mois {anchor}'
  sensitive: 'Données de santé et autres données sensibles : {weeks} semaines {anchor}'
  none: 'Les informations sur la protection des données n’indiquent aucune durée.'
  edit: 'Modifier dans les paramètres de confidentialité de l’organisation'
delete:
  preserve: 'Avant de supprimer, garde une copie de tout ce que tu dois conserver légalement, comme des factures ou des justificatifs pour un financeur, par exemple en l’exportant.'
  title: 'Supprimer les données d’inscription'
  summary: 'Possible à tout moment. Les données sensibles font partie des données d’inscription.'
  noAutomaticDeletion: 'Rien n’est supprimé automatiquement.'
event:
  preserve: 'Avant de supprimer l’événement, exporte les finances et tout ce que tu dois conserver légalement, comme les justificatifs, les versements ou les listes d’inscription pour un financeur.'
  removes: 'Tout ce qui appartient à l’événement est supprimé définitivement, par exemple :'
  keepsTitle: 'Seuls subsistent :'
  keeps:
    newsletter: 'les abonnés à la newsletter importés de ses inscriptions, dans la newsletter de l’organisation'
    audit: 'le journal d’activité pendant deux ans au plus, sans aucune réponse'
    outside: 'les e-mails déjà envoyés et les données déjà exportées, hors de cette plateforme'
  after: 'La page publique et le lien d’inscription ne fonctionnent plus, et l’événement ne peut plus servir de modèle.'
  effect:
    registrations: 'toutes les inscriptions, y compris les données sensibles'
    finances: 'les finances : dépenses, justificatifs et versements'
    files: 'tous les fichiers de l’événement'
    planning: 'chambres, programme, tâches et plannings de service'
    messages: 'messages envoyés et modèles d’e-mail'
    access: 'l’accès de tous les responsables'
  title: 'Supprimer l’événement'
  summary: 'L’événement et tout ce qui lui appartient.'
  action: 'Supprimer l’événement'
  dialog:
    title: 'Supprimer l’événement ?'
kind:
  sensitive: 'Données de santé et autres données sensibles'
  registrations: 'Toutes les données d’inscription'
status:
  upcoming: 'À venir'
  due_soon: 'Bientôt'
  overdue: 'En retard'
  resolved: 'Supprimé'
date:
  due: 'À supprimer avant le {date}'
  postponed: 'Reporté au {date} (initialement {original})'
  deleted: 'Supprimé le {date}'
  estimate: 'Délai prévu : {date}'
  afterSubmission: 'Délai compté à partir de chaque inscription'
  unknown: 'Aucun délai'
postponedBy: 'Reporté par {name} : {reason}'
action:
  postpone: 'Reporter'
  delete:
    sensitive: 'Supprimer les données sensibles'
    registrations: 'Supprimer toutes les inscriptions'
request:
  load:
    error: 'Impossible de charger les délais de conservation'
  postpone:
    error: 'Impossible de reporter le délai'
    success: 'Délai reporté'
  purge:
    progress: 'Suppression des données…'
    error: 'Impossible de supprimer les données'
    success: 'Données supprimées'
effect:
  sensitive: 'Supprime dans toutes les inscriptions les réponses aux questions de santé et autres questions sensibles, y compris les fichiers associés. Le reste des inscriptions est conservé. Les nouvelles inscriptions ne sont plus possibles ensuite.'
  registrations: 'Supprime toutes les inscriptions de cet événement avec leurs fichiers et données sensibles. Les attributions de chambres sont libérées. L’événement ne pourra plus jamais recevoir d’inscriptions.'
purge:
  label: 'nom de l’événement'
  irreversible: 'Cette action est irréversible.'
  sensitive: 'Supprimer les données sensibles ?'
  registrations: 'Supprimer toutes les inscriptions ?'
early:
  registration: 'Les inscriptions sont encore ouvertes ou prévues. La suppression les ferme immédiatement et définitivement.'
  event: 'L’événement n’est pas encore terminé. Les données nécessaires pendant celui-ci, comme les informations de santé, disparaîtraient.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Dane i usuwanie'
subtitle: 'Jak długo to wydarzenie przechowuje dane zgłoszeń i jak je usunąć.'
periods:
  title: 'Okresy przechowywania'
  summary: 'Ustalone w informacjach o ochronie danych Twojej organizacji. Każde zgłoszenie zachowuje okresy, które mu pokazano.'
  registrations: 'Dane zgłoszeń: {months} mies. {anchor}'
  sensitive: 'Dane o zdrowiu i inne dane wrażliwe: {weeks} tyg. {anchor}'
  none: 'Informacje o ochronie danych nie podają okresu.'
  edit: 'Zmień w ustawieniach prywatności organizacji'
delete:
  preserve: 'Przed usunięciem zachowaj kopię wszystkiego, co musisz przechowywać z mocy prawa, np. faktur lub dokumentów dla grantodawcy, na przykład eksportując je.'
  title: 'Usuń dane zgłoszeń'
  summary: 'Możliwe w każdej chwili. Dane wrażliwe są częścią danych zgłoszeń.'
  noAutomaticDeletion: 'Nic nie jest usuwane automatycznie.'
event:
  preserve: 'Przed usunięciem wydarzenia wyeksportuj finanse i wszystko, co musisz przechowywać z mocy prawa, np. paragony, wypłaty lub listy zgłoszeń dla grantodawcy.'
  removes: 'Wszystko, co należy do wydarzenia, zostanie trwale usunięte, na przykład:'
  keepsTitle: 'Pozostaną tylko:'
  keeps:
    newsletter: 'subskrybenci newslettera zaimportowani ze zgłoszeń, w newsletterze organizacji'
    audit: 'dziennik aktywności do dwóch lat, bez żadnych odpowiedzi'
    outside: 'już wysłane e-maile i wyeksportowane dane poza tą platformą'
  after: 'Strona publiczna i link do zgłoszeń przestaną działać, a wydarzenia nie będzie można użyć jako szablonu.'
  effect:
    registrations: 'wszystkie zgłoszenia, łącznie z danymi wrażliwymi'
    finances: 'finanse: wydatki, paragony i wypłaty'
    files: 'wszystkie pliki wydarzenia'
    planning: 'pokoje, program, zadania i grafiki dyżurów'
    messages: 'wysłane wiadomości i szablony e-maili'
    access: 'dostęp wszystkich osób zarządzających'
  title: 'Usuń wydarzenie'
  summary: 'Wydarzenie i wszystko, co do niego należy.'
  action: 'Usuń wydarzenie'
  dialog:
    title: 'Usunąć wydarzenie?'
kind:
  sensitive: 'Dane o zdrowiu i inne dane wrażliwe'
  registrations: 'Wszystkie dane zgłoszeń'
status:
  upcoming: 'Nadchodzący'
  due_soon: 'Wkrótce'
  overdue: 'Po terminie'
  resolved: 'Usunięte'
date:
  due: 'Usunąć do {date}'
  postponed: 'Przesunięto na {date} (pierwotnie {original})'
  deleted: 'Usunięto {date}'
  estimate: 'Przewidywany termin: {date}'
  afterSubmission: 'Termin liczony od każdego zgłoszenia'
  unknown: 'Brak terminu'
postponedBy: 'Przesunął(-ęła) {name}: {reason}'
action:
  postpone: 'Przesuń'
  delete:
    sensitive: 'Usuń dane wrażliwe'
    registrations: 'Usuń wszystkie zgłoszenia'
request:
  load:
    error: 'Nie udało się wczytać terminów przechowywania'
  postpone:
    error: 'Nie udało się przesunąć terminu'
    success: 'Termin przesunięty'
  purge:
    progress: 'Usuwanie danych…'
    error: 'Nie udało się usunąć danych'
    success: 'Dane usunięte'
effect:
  sensitive: 'Usuwa ze wszystkich zgłoszeń odpowiedzi na pytania o zdrowie i inne pytania wrażliwe, łącznie z przesłanymi do nich plikami. Reszta zgłoszeń pozostaje. Nowe zgłoszenia nie będą już możliwe.'
  registrations: 'Usuwa wszystkie zgłoszenia tego wydarzenia wraz z plikami i danymi wrażliwymi. Przydziały pokoi zostaną zwolnione. Wydarzenie nigdy więcej nie przyjmie zgłoszeń.'
purge:
  label: 'nazwę wydarzenia'
  irreversible: 'Tego nie można cofnąć.'
  sensitive: 'Usunąć dane wrażliwe?'
  registrations: 'Usunąć wszystkie zgłoszenia?'
early:
  registration: 'Zgłoszenia są jeszcze otwarte lub zaplanowane. Usunięcie zamyka je natychmiast i na stałe.'
  event: 'Wydarzenie jeszcze się nie zakończyło. Dane potrzebne w jego trakcie, np. informacje o zdrowiu, zostałyby utracone.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Údaje a mazání'
subtitle: 'Jak dlouho tato akce uchovává údaje z přihlášek a jak je smazat.'
periods:
  title: 'Lhůty uchování'
  summary: 'Stanoveny v informacích o ochraně osobních údajů vaší organizace. Každá přihláška si ponechává lhůty, které jí byly ukázány.'
  registrations: 'Údaje z přihlášek: {months} měsíců {anchor}'
  sensitive: 'Zdravotní a další citlivé údaje: {weeks} týdnů {anchor}'
  none: 'Informace o ochraně osobních údajů neuvádějí žádnou lhůtu.'
  edit: 'Změnit v nastavení ochrany údajů organizace'
delete:
  preserve: 'Před smazáním si uložte kopii všeho, co musíte ze zákona uchovávat, například faktury nebo doklady pro poskytovatele dotace, třeba exportem.'
  title: 'Smazat údaje z přihlášek'
  summary: 'Možné kdykoli. Citlivé údaje jsou součástí údajů z přihlášek.'
  noAutomaticDeletion: 'Nic se nemaže automaticky.'
event:
  preserve: 'Před smazáním akce exportujte finance a vše, co musíte ze zákona uchovávat, například doklady, výplaty nebo seznamy přihlášek pro poskytovatele dotace.'
  removes: 'Vše, co k akci patří, se trvale smaže, například:'
  keepsTitle: 'Zachová se pouze:'
  keeps:
    newsletter: 'odběratelé newsletteru importovaní z přihlášek, v newsletteru organizace'
    audit: 'protokol aktivit nejvýše dva roky, bez odpovědí'
    outside: 'již odeslané e-maily a exportovaná data mimo tuto platformu'
  after: 'Veřejná stránka a odkaz na přihlášku přestanou fungovat a akci už nepůjde použít jako šablonu.'
  effect:
    registrations: 'všechny přihlášky včetně citlivých údajů'
    finances: 'finance: výdaje, doklady a výplaty'
    files: 'všechny soubory akce'
    planning: 'pokoje, program, úkoly a rozpisy služeb'
    messages: 'odeslané zprávy a šablony e-mailů'
    access: 'přístup všech správců'
  title: 'Smazat akci'
  summary: 'Akce a vše, co k ní patří.'
  action: 'Smazat akci'
  dialog:
    title: 'Smazat akci?'
kind:
  sensitive: 'Zdravotní a další citlivé údaje'
  registrations: 'Všechny údaje z přihlášek'
status:
  upcoming: 'Nadcházející'
  due_soon: 'Brzy'
  overdue: 'Po lhůtě'
  resolved: 'Smazáno'
date:
  due: 'Smazat do {date}'
  postponed: 'Odloženo na {date} (původně {original})'
  deleted: 'Smazáno {date}'
  estimate: 'Předpokládaná lhůta: {date}'
  afterSubmission: 'Lhůta se počítá od každé přihlášky'
  unknown: 'Bez lhůty'
postponedBy: 'Odložil(a) {name}: {reason}'
action:
  postpone: 'Odložit'
  delete:
    sensitive: 'Smazat citlivé údaje'
    registrations: 'Smazat všechny přihlášky'
request:
  load:
    error: 'Lhůty uchování se nepodařilo načíst'
  postpone:
    error: 'Lhůtu se nepodařilo odložit'
    success: 'Lhůta odložena'
  purge:
    progress: 'Mazání údajů…'
    error: 'Údaje se nepodařilo smazat'
    success: 'Údaje smazány'
effect:
  sensitive: 'Smaže ve všech přihláškách odpovědi na zdravotní a další citlivé otázky, včetně k nim nahraných souborů. Zbytek přihlášek zůstane. Nové přihlášky pak již nebudou možné.'
  registrations: 'Smaže všechny přihlášky této akce s jejich soubory a citlivými údaji. Přidělení pokojů se uvolní. Akce už nikdy nebude přijímat přihlášky.'
purge:
  label: 'název akce'
  irreversible: 'Tuto akci nelze vrátit.'
  sensitive: 'Smazat citlivé údaje?'
  registrations: 'Smazat všechny přihlášky?'
early:
  registration: 'Přihlašování je ještě otevřené nebo naplánované. Smazání ho okamžitě a natrvalo uzavře.'
  event: 'Akce ještě neskončila. Údaje potřebné během ní, například zdravotní informace, by zmizely.'
</i18n>
