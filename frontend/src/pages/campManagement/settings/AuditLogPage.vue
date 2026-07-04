<template>
  <page-state-handler
    padding
    :error
    :loading
    class="audit-log-page row justify-center"
  >
    <div class="col-12 col-sm-11 col-md-9 col-lg-7 column q-gutter-y-md">
      <div class="page-title">
        <div class="text-h5 text-weight-medium">
          {{ t('title') }}
        </div>
        <div class="text-body2 text-grey-6 q-mt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <!-- Filters -->
      <q-card
        v-if="auditEntries.length > 0"
        flat
        bordered
        class="filter-card rounded-lg"
      >
        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-5">
            <q-select
              v-model="selectedEntityTypes"
              :options="entityTypeOptions"
              :label="t('filter.entityType')"
              emit-value
              map-options
              multiple
              dense
              outlined
              clearable
              use-chips
            />
          </div>
          <div class="col-12 col-sm-5">
            <q-select
              v-model="selectedActorIds"
              :options="actorOptions"
              :label="t('filter.actor')"
              emit-value
              map-options
              multiple
              dense
              outlined
              clearable
              use-chips
            />
          </div>
          <div class="col-12 col-sm-auto">
            <q-toggle
              v-model="hideSystemEvents"
              :label="t('filter.hideSystemEvents')"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Empty state -->
      <div
        v-if="timelineEntries.length === 0"
        class="empty-state col column items-center justify-center"
      >
        <q-icon
          name="history"
          size="64px"
          class="empty-icon"
        />
        <div class="text-h6 q-mt-md">
          {{
            auditEntries.length === 0
              ? t('empty.title')
              : t('empty.filteredTitle')
          }}
        </div>
        <div class="text-body2 text-grey-6 q-mt-xs text-center">
          {{
            auditEntries.length === 0
              ? t('empty.message')
              : t('empty.filteredMessage')
          }}
        </div>
      </div>

      <!-- Entries, grouped by day -->
      <div
        v-else
        class="column q-gutter-y-lg"
      >
        <div
          v-for="group in groupedEntries"
          :key="group.key"
          class="column q-gutter-y-sm"
        >
          <div class="text-overline audit-day-header">
            {{ group.label }}
          </div>

          <q-card
            v-for="entry in group.entries"
            :key="entry.id"
            flat
            bordered
            class="audit-entry rounded-lg"
          >
            <q-card-section>
              <div class="row items-center no-wrap q-gutter-x-sm">
                <q-avatar
                  :color="entry.color"
                  text-color="white"
                  size="36px"
                >
                  <q-icon
                    :name="entry.icon"
                    size="20px"
                  />
                </q-avatar>
                <div class="col ellipsis">
                  <div class="text-body1 text-weight-medium ellipsis">
                    {{ entry.title }}
                  </div>
                  <div
                    v-if="entry.subject"
                    class="text-body2 text-weight-medium ellipsis audit-entry__subject"
                  >
                    {{ entry.subject }}
                  </div>
                  <div class="text-caption audit-entry__meta">
                    {{
                      entry.actor
                        ? t('by', { actor: entry.actor })
                        : t('bySystem')
                    }}
                  </div>
                </div>
                <div class="text-caption audit-entry__time">
                  {{ entry.time }}
                </div>
              </div>

              <div
                v-if="entry.valueDetails.length || entry.fieldLabels.length"
                class="audit-entry__chips"
              >
                <q-chip
                  v-for="(detail, index) in entry.valueDetails"
                  :key="`v${index.toString()}`"
                  dense
                  size="sm"
                  color="primary"
                  text-color="white"
                  class="audit-field-chip"
                >
                  {{ detail.label }}: {{ detail.value }}
                </q-chip>
                <q-chip
                  v-for="(field, index) in entry.fieldLabels"
                  :key="`f${index.toString()}`"
                  dense
                  outline
                  size="sm"
                  color="primary"
                  class="audit-field-chip"
                >
                  {{ field }}
                </q-chip>
              </div>

              <div class="row items-center justify-between audit-entry__footer">
                <div class="text-caption audit-entry__id">
                  {{ t('entityId', { id: entry.entityId }) }}
                  <q-tooltip>{{ entry.entityId }}</q-tooltip>
                </div>
                <q-btn
                  v-if="entry.entityType === 'registration'"
                  round
                  flat
                  dense
                  size="sm"
                  icon="open_in_new"
                  color="primary"
                  @click="viewRegistration(entry.entityId)"
                >
                  <q-tooltip>{{ t('viewRegistration') }}</q-tooltip>
                </q-btn>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </page-state-handler>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import type {
  AuditEntityType,
  AuditLogEntry,
  AuditValue,
} from '@camp-registration/common/entities';
import { useAPIService } from 'src/services/APIService';
import { useAuditTimeline } from 'src/composables/auditTimeline';
import { useAuditFieldLabels } from 'src/composables/auditFieldLabels';
import { useCampDetailsStore } from 'src/stores/camp-details-store';
import { extractFormFields } from 'src/utils/surveyJS';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import RegistrationDetailsDialog from 'components/campManagement/table/dialogs/RegistrationDetailsDialog.vue';

const { t, locale } = useI18n();
const route = useRoute();
const quasar = useQuasar();
const apiService = useAPIService();
const { formatTime, formatDay, actorLabel, actionColor, entityIcon } =
  useAuditTimeline();
const {
  entityLabel,
  actionLabel,
  valueLabel,
  fieldLabel,
  valueDisplay,
  isHiddenValueKey,
} = useAuditFieldLabels();

const campId = computed(() => {
  const value = route.params.campId;
  return typeof value === 'string' ? value : null;
});

// Question labels for `data.*`/`form.*` audit paths, from the camp's current
// form (already kept up to date by the app-wide camp-details store).
const { data: camp } = storeToRefs(useCampDetailsStore());

const formFieldLabels = computed<Map<string, string>>(() => {
  const form = camp.value?.form;
  if (!form) {
    return new Map();
  }
  return new Map(
    extractFormFields(form).map(({ value, label }) => [value, label]),
  );
});

const auditEntries = ref<AuditLogEntry[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  if (!campId.value) {
    loading.value = false;
    return;
  }

  try {
    auditEntries.value = await apiService.fetchCampAuditLog(campId.value);
  } catch {
    error.value = t('error.load');
  } finally {
    loading.value = false;
  }
});

// Opens the registration's existing detail dialog with its current (live) data
// — the audit log itself never stores registration content, only field names.
async function viewRegistration(registrationId: string): Promise<void> {
  if (!campId.value) {
    return;
  }

  try {
    const registration = await apiService.fetchRegistration(
      campId.value,
      registrationId,
    );
    quasar.dialog({
      component: RegistrationDetailsDialog,
      componentProps: { registration },
    });
  } catch {
    quasar.notify({ type: 'negative', message: t('error.registrationGone') });
  }
}

// All possible entity types, not just the ones present in the current data —
// otherwise a type disappears from the filter once nothing of it remains.
const ENTITY_TYPES: AuditEntityType[] = [
  'camp',
  'registration',
  'campManager',
  'message',
  'messageTemplate',
];

const entityTypeOptions = computed(() =>
  ENTITY_TYPES.map((entityType) => ({
    label: entityLabel(entityType),
    value: entityType,
  })),
);

// Only actors actually present in the log — no point listing everyone who
// could ever act on the camp.
const actorOptions = computed(() => {
  const byId = new Map<string, string>();
  for (const entry of auditEntries.value) {
    if (entry.actor) {
      byId.set(entry.actor.id, entry.actor.name ?? t('deletedUser'));
    }
  }
  return [...byId.entries()]
    .map(([value, label]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const selectedEntityTypes = ref<AuditEntityType[]>([]);
const selectedActorIds = ref<string[]>([]);
// Public/self-service actions (no actor) tend to dominate the trail — default
// to hiding them so manager/director activity isn't buried underneath.
const hideSystemEvents = ref(true);

const filteredAuditEntries = computed<AuditLogEntry[]>(() =>
  auditEntries.value.filter((entry) => {
    if (
      selectedEntityTypes.value.length > 0 &&
      !selectedEntityTypes.value.includes(entry.entityType)
    ) {
      return false;
    }
    if (entry.actor === null) {
      return !hideSystemEvents.value && selectedActorIds.value.length === 0;
    }
    if (
      selectedActorIds.value.length > 0 &&
      !selectedActorIds.value.includes(entry.actor.id)
    ) {
      return false;
    }
    return true;
  }),
);

interface ValueDetail {
  label: string;
  value: string;
}

function buildValueDetails(
  entityType: AuditEntityType,
  changedValues: Record<string, AuditValue> | undefined,
): ValueDetail[] {
  return Object.entries(changedValues ?? {})
    .filter(([key]) => !isHiddenValueKey(key))
    .map(([key, value]) => ({
      label: valueLabel(entityType, key),
      value: valueDisplay(entityType, key, value),
    }));
}

// "Today" / "Yesterday" read faster than a full date for the entries managers
// check most often; anything older falls back to the full localized date.
function dayLabel(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return t('today');
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return t('yesterday');
  }
  return formatDay(timestamp, locale.value);
}

interface TimelineDisplayEntry {
  id: string;
  entityId: string;
  entityType: AuditEntityType;
  title: string;
  subject: string | null;
  time: string;
  dayKey: string;
  dayLabel: string;
  color: string;
  icon: string;
  fieldLabels: string[];
  valueDetails: ValueDetail[];
  actor: string | null;
}

const buildEntry = (entry: AuditLogEntry): TimelineDisplayEntry => ({
  id: entry.id,
  entityId: entry.entityId,
  entityType: entry.entityType,
  title: `${entityLabel(entry.entityType)} — ${actionLabel(entry.action)}`,
  subject: actorLabel(entry.subject, t('deletedUser')),
  time: formatTime(entry.createdAt, locale.value),
  dayKey: new Date(entry.createdAt).toDateString(),
  dayLabel: dayLabel(entry.createdAt),
  color: actionColor(entry.action),
  icon: entityIcon(entry.entityType),
  fieldLabels: (entry.changes?.changedFields ?? []).map((path) =>
    fieldLabel(entry.entityType, path, formFieldLabels.value),
  ),
  valueDetails: buildValueDetails(
    entry.entityType,
    entry.changes?.changedValues,
  ),
  actor: actorLabel(entry.actor, t('deletedUser')),
});

const timelineEntries = computed<TimelineDisplayEntry[]>(() =>
  filteredAuditEntries.value.map(buildEntry),
);

interface EntryGroup {
  key: string;
  label: string;
  entries: TimelineDisplayEntry[];
}

// Entries arrive newest-first from the API, so consecutive same-day entries
// are already adjacent — a single pass is enough to bucket them.
const groupedEntries = computed<EntryGroup[]>(() => {
  const groups: EntryGroup[] = [];
  for (const entry of timelineEntries.value) {
    const last = groups.at(-1);
    if (last?.key === entry.dayKey) {
      last.entries.push(entry);
    } else {
      groups.push({
        key: entry.dayKey,
        label: entry.dayLabel,
        entries: [entry],
      });
    }
  }
  return groups;
});
</script>

<style scoped>
.empty-state {
  padding: 48px 16px;
}

.empty-icon {
  color: var(--md3-on-surface-variant);

  opacity: 0.6;
}

.filter-card,
.audit-entry {
  background: var(--md3-surface-container-lowest);
  border-color: var(--md3-outline-variant);
}

.audit-day-header {
  color: var(--md3-on-surface-variant);
  padding-left: 4px;
}

.audit-entry__subject {
  color: var(--md3-primary);
}

.audit-entry__meta,
.audit-entry__time,
.audit-entry__id {
  color: var(--md3-on-surface-variant);
}

.audit-entry__time {
  flex-shrink: 0;
}

.audit-entry__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 10px;
}

.audit-entry__footer {
  margin-top: 8px;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Audit Log'
subtitle: 'A history of changes made to this camp, its registrations, and its team.'
by: 'by {actor}'
bySystem: 'System event'
entityId: 'ID: {id}'
viewRegistration: 'View registration'
deletedUser: 'Deleted user'
today: 'Today'
yesterday: 'Yesterday'
filter:
  entityType: 'Event type'
  actor: 'Actor'
  hideSystemEvents: 'Hide system events'
empty:
  title: 'No activity yet'
  message: 'Changes to this camp will show up here.'
  filteredTitle: 'No matching events'
  filteredMessage: 'Try adjusting the filters above.'
error:
  load: 'Failed to load the audit log'
  registrationGone: 'This registration no longer exists'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Aktivitätsprotokoll'
subtitle: 'Ein Verlauf der Änderungen an diesem Camp, seinen Anmeldungen und seinem Team.'
by: 'von {actor}'
bySystem: 'Systemereignis'
entityId: 'ID: {id}'
viewRegistration: 'Anmeldung ansehen'
deletedUser: 'Gelöschter Benutzer'
today: 'Heute'
yesterday: 'Gestern'
filter:
  entityType: 'Ereignistyp'
  actor: 'Ausgeführt von'
  hideSystemEvents: 'Systemereignisse ausblenden'
empty:
  title: 'Noch keine Aktivität'
  message: 'Änderungen an diesem Camp erscheinen hier.'
  filteredTitle: 'Keine passenden Ereignisse'
  filteredMessage: 'Passe die Filter oben an.'
error:
  load: 'Aktivitätsprotokoll konnte nicht geladen werden'
  registrationGone: 'Diese Anmeldung existiert nicht mehr'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Journal d’activité'
subtitle: 'Un historique des modifications apportées à ce camp, ses inscriptions et son équipe.'
by: 'par {actor}'
bySystem: 'Événement système'
entityId: 'ID : {id}'
viewRegistration: 'Voir l’inscription'
deletedUser: 'Utilisateur supprimé'
today: 'Aujourd’hui'
yesterday: 'Hier'
filter:
  entityType: 'Type d’événement'
  actor: 'Auteur'
  hideSystemEvents: 'Masquer les événements système'
empty:
  title: 'Aucune activité pour le moment'
  message: 'Les modifications apportées à ce camp apparaîtront ici.'
  filteredTitle: 'Aucun événement correspondant'
  filteredMessage: 'Essayez d’ajuster les filtres ci-dessus.'
error:
  load: 'Échec du chargement du journal d’activité'
  registrationGone: 'Cette inscription n’existe plus'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Dziennik aktywności'
subtitle: 'Historia zmian w tym obozie, jego zgłoszeniach i zespole.'
by: 'przez {actor}'
bySystem: 'Zdarzenie systemowe'
entityId: 'ID: {id}'
viewRegistration: 'Zobacz zgłoszenie'
deletedUser: 'Usunięty użytkownik'
today: 'Dzisiaj'
yesterday: 'Wczoraj'
filter:
  entityType: 'Typ zdarzenia'
  actor: 'Wykonawca'
  hideSystemEvents: 'Ukryj zdarzenia systemowe'
empty:
  title: 'Brak aktywności'
  message: 'Zmiany w tym obozie będą się tutaj pojawiać.'
  filteredTitle: 'Brak pasujących zdarzeń'
  filteredMessage: 'Spróbuj dostosować powyższe filtry.'
error:
  load: 'Nie udało się załadować dziennika aktywności'
  registrationGone: 'To zgłoszenie już nie istnieje'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Deník aktivit'
subtitle: 'Historie změn tohoto tábora, jeho registrací a týmu.'
by: 'od {actor}'
bySystem: 'Systémová událost'
entityId: 'ID: {id}'
viewRegistration: 'Zobrazit registraci'
deletedUser: 'Smazaný uživatel'
today: 'Dnes'
yesterday: 'Včera'
filter:
  entityType: 'Typ události'
  actor: 'Provedl'
  hideSystemEvents: 'Skrýt systémové události'
empty:
  title: 'Zatím žádná aktivita'
  message: 'Změny tohoto tábora se zobrazí zde.'
  filteredTitle: 'Žádné odpovídající události'
  filteredMessage: 'Zkuste upravit filtry výše.'
error:
  load: 'Nepodařilo se načíst deník aktivit'
  registrationGone: 'Tato registrace již neexistuje'
</i18n>
