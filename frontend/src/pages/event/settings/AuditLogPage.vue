<template>
  <page-state-handler
    padding
    :error
    :loading
    class="audit-log-page row justify-center"
  >
    <div
      class="audit-log-content col-12 col-md-11 col-lg-10 column q-gutter-y-lg"
    >
      <div class="row items-start justify-between q-col-gutter-y-sm">
        <div class="col-12 col-sm page-title">
          <div class="text-h5 text-weight-medium">
            {{ t('title') }}
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ t('subtitle') }}
          </div>
        </div>
        <div class="col-auto">
          <q-btn
            :label="t('refresh')"
            :loading="refreshing"
            icon="refresh"
            color="primary"
            rounded
            outline
            no-caps
            @click="refresh"
          />
        </div>
      </div>

      <!-- Filters -->
      <div
        v-if="auditEntries.length > 0"
        class="row items-center filter-row"
      >
        <span class="text-caption text-grey-7">{{ t('filter.label') }}</span>
        <q-chip
          v-for="option in entityTypeOptions"
          :key="option.value"
          clickable
          class="filter-chip"
          :class="{
            'filter-chip--active': selectedEntityTypes.includes(option.value),
          }"
          @click="toggleEntityType(option.value)"
        >
          {{ option.label }}
          <q-icon
            v-if="selectedEntityTypes.includes(option.value)"
            name="check"
            size="16px"
            class="q-ml-xs"
          />
        </q-chip>

        <q-chip
          v-if="actorOptions.length > 0"
          clickable
          class="filter-chip"
          :class="{ 'filter-chip--active': selectedActorIds.length > 0 }"
        >
          {{ t('filter.actor') }}
          <template v-if="selectedActorIds.length > 0">
            ({{ selectedActorIds.length }})
          </template>
          <q-icon
            name="arrow_drop_down"
            size="18px"
            class="q-ml-xs"
          />
          <q-menu>
            <q-list style="min-width: 220px">
              <q-item
                v-for="option in actorOptions"
                :key="option.value"
                clickable
                @click="toggleActor(option.value)"
              >
                <q-item-section>{{ option.label }}</q-item-section>
                <q-item-section
                  v-if="selectedActorIds.includes(option.value)"
                  side
                >
                  <q-icon
                    name="check"
                    color="primary"
                    size="18px"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-chip>

        <q-chip
          v-if="historyEntityId"
          removable
          class="filter-chip filter-chip--active"
          @remove="historyEntityId = null"
        >
          {{ t('filter.history', { id: shortId(historyEntityId) }) }}
        </q-chip>

        <q-chip
          clickable
          class="filter-chip"
          :class="{ 'filter-chip--active': showSystemEvents }"
          @click="showSystemEvents = !showSystemEvents"
        >
          {{ t('filter.showSystemEvents') }}
          <q-icon
            v-if="showSystemEvents"
            name="check"
            size="16px"
            class="q-ml-xs"
          />
        </q-chip>
      </div>

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
        class="column q-gutter-y-md"
      >
        <div
          v-for="group in groupedEntries"
          :key="group.key"
        >
          <div class="text-subtitle2 text-weight-medium q-mb-xs">
            {{ group.label }}
          </div>

          <q-card
            flat
            bordered
            class="section-card"
          >
            <q-list separator>
              <q-item
                v-for="entry in group.entries"
                :key="entry.id"
              >
                <q-item-section
                  avatar
                  top
                >
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
                </q-item-section>

                <q-item-section class="audit-entry__content">
                  <q-item-label>{{ entry.title }}</q-item-label>
                  <q-item-label
                    v-if="entry.subject"
                    caption
                    class="audit-entry__subject"
                  >
                    {{ entry.subject }}
                  </q-item-label>
                  <q-item-label caption>
                    {{
                      entry.actor
                        ? t('by', { actor: entry.actor })
                        : t('bySystem')
                    }}
                  </q-item-label>

                  <div
                    v-if="entry.valueDetails.length || entry.fieldLabels.length"
                    class="audit-entry__chips"
                  >
                    <q-chip
                      v-for="(detail, index) in entry.valueDetails"
                      :key="`v${index.toString()}`"
                      dense
                      class="audit-chip audit-chip--value"
                    >
                      {{ detail.label }}: {{ detail.value }}
                    </q-chip>
                    <q-chip
                      v-for="(field, index) in entry.fieldLabels"
                      :key="`f${index.toString()}`"
                      dense
                      class="audit-chip audit-chip--field"
                    >
                      {{ field }}
                    </q-chip>
                  </div>
                </q-item-section>

                <q-item-section
                  side
                  top
                  class="audit-entry__meta-side"
                >
                  <span class="audit-entry__time">{{ entry.time }}</span>
                  <q-btn
                    flat
                    dense
                    no-caps
                    rounded
                    size="sm"
                    class="audit-entry__id"
                    :label="`#${shortId(entry.entityId)}`"
                    @click="historyEntityId = entry.entityId"
                  >
                    <q-tooltip>
                      {{ t('showHistory', { id: entry.entityId }) }}
                    </q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="entry.openLabel"
                    flat
                    round
                    dense
                    size="sm"
                    icon="open_in_new"
                    color="primary"
                    @click="openEntry(entry)"
                  >
                    <q-tooltip>{{ entry.openLabel }}</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-list>
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
import {
  AUDIT_ENTITY_TYPES,
  type AuditActor,
  type AuditEntityType,
  type AuditLogEntry,
  type AuditValue,
} from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useAuditTimeline } from '@/composables/audit/auditTimeline';
import { useAuditLabels } from '@/composables/audit/auditLabels';
import { useAuditEntities } from '@/composables/audit/auditEntities';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { extractFormFields } from '@/utils/surveyJS';
import PageStateHandler from '@/components/common/PageStateHandler.vue';

const { t, locale } = useI18n();
const route = useRoute();
const quasar = useQuasar();
const apiService = useAPIService();
const { formatTime, formatDay, actorLabel, actionColor } = useAuditTimeline();
const { entityLabel, actionLabel, fieldLabel, valueLabel, reasonLabel } =
  useAuditLabels();
const entityViews = useAuditEntities();

const eventId = computed(() => {
  const value = route.params.eventId;
  return typeof value === 'string' ? value : null;
});

// Question labels for `data.*`/`form.*` audit paths, from the event's current
// form (already kept up to date by the app-wide event-details store).
const { data: event } = storeToRefs(useEventDetailsStore());

const formFieldLabels = computed<Map<string, string>>(() => {
  const form = event.value?.form;
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

// Best-effort — without it, entries only lose their live names and links.
function loadEntityViews(id: string): void {
  for (const view of Object.values(entityViews)) {
    view.load?.(id).catch(() => undefined);
  }
}

onMounted(async () => {
  if (!eventId.value) {
    loading.value = false;
    return;
  }

  try {
    auditEntries.value = await apiService.fetchEventAuditLog(eventId.value);
  } catch {
    error.value = t('error.load');
  } finally {
    loading.value = false;
  }

  loadEntityViews(eventId.value);
});

// There's no live update yet, so new entries need an explicit reload. A
// failure keeps the current entries on screen rather than the error state.
const refreshing = ref(false);

async function refresh(): Promise<void> {
  if (!eventId.value || refreshing.value) {
    return;
  }
  refreshing.value = true;
  try {
    auditEntries.value = await apiService.fetchEventAuditLog(eventId.value);
    error.value = null;
    loadEntityViews(eventId.value);
  } catch {
    quasar.notify({ type: 'negative', message: t('error.load') });
  } finally {
    refreshing.value = false;
  }
}

// The random tail of the ULID — its head is a timestamp, shared by records
// created around the same time.
function shortId(id: string): string {
  return id.slice(-8);
}

// Users resolved for any entry of a record, so an older entry recorded before
// the user was known (e.g. a pending invitation) can still name them.
const knownSubjects = computed(() => {
  const subjects = new Map<string, AuditActor>();
  for (const entry of auditEntries.value) {
    if (entry.subject) {
      subjects.set(entry.entityId, entry.subject);
    }
  }
  return subjects;
});

function subjectOf(entry: AuditLogEntry): string | null {
  const custom = entityViews[entry.entityType].subject?.(entry);
  if (custom !== undefined) {
    return custom;
  }
  const subject = entry.subject ?? knownSubjects.value.get(entry.entityId);
  if (subject) {
    return actorLabel(subject, t('deletedUser'));
  }
  return entry.details?.subjectHint ?? null;
}

function displayValue(
  entityType: AuditEntityType,
  key: string,
  value: AuditValue,
): string {
  return (
    entityViews[entityType].formatValue?.(key, value) ??
    valueLabel(entityType, key, value)
  );
}

// The subject plus the identifying context, e.g. "Jane Doe · Viewer" — a
// context value that changed is shown as a value chip instead.
function subjectLine(entry: AuditLogEntry): string | null {
  const values = entry.details?.values ?? {};
  const context = Object.entries(entry.details?.context ?? {})
    .filter(([key]) => !(key in values))
    .map(([key, value]) => displayValue(entry.entityType, key, value));
  const parts = [subjectOf(entry), ...context].filter(
    (part): part is string => !!part,
  );
  return parts.length > 0 ? parts.join(' · ') : null;
}

function openEntry(entry: TimelineDisplayEntry): void {
  if (eventId.value) {
    void entityViews[entry.entityType].open?.run(eventId.value, entry.entityId);
  }
}

const entityTypeOptions = computed(() =>
  AUDIT_ENTITY_TYPES.map((entityType) => ({
    label: entityLabel(entityType),
    value: entityType,
  })),
);

// Only actors actually present in the log — no point listing everyone who
// could ever act on the event.
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
const showSystemEvents = ref(false);
// Narrows the log to one record's full history, overriding the other filters.
const historyEntityId = ref<string | null>(null);

function toggleEntityType(entityType: AuditEntityType): void {
  selectedEntityTypes.value = selectedEntityTypes.value.includes(entityType)
    ? selectedEntityTypes.value.filter((value) => value !== entityType)
    : [...selectedEntityTypes.value, entityType];
}

function toggleActor(actorId: string): void {
  selectedActorIds.value = selectedActorIds.value.includes(actorId)
    ? selectedActorIds.value.filter((value) => value !== actorId)
    : [...selectedActorIds.value, actorId];
}

const filteredAuditEntries = computed<AuditLogEntry[]>(() =>
  auditEntries.value.filter((entry) => {
    if (historyEntityId.value) {
      return entry.entityId === historyEntityId.value;
    }
    if (
      selectedEntityTypes.value.length > 0 &&
      !selectedEntityTypes.value.includes(entry.entityType)
    ) {
      return false;
    }
    if (entry.actor === null) {
      return showSystemEvents.value && selectedActorIds.value.length === 0;
    }

    return !(
      selectedActorIds.value.length > 0 &&
      !selectedActorIds.value.includes(entry.actor.id)
    );
  }),
);

interface ValueDetail {
  label: string;
  value: string;
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
  openLabel: string | null;
}

function buildEntry(entry: AuditLogEntry): TimelineDisplayEntry {
  const { entityType } = entry;
  const view = entityViews[entityType];
  const details = entry.details;
  const values = details?.values ?? {};
  const exists = view.exists?.(entry.entityId) ?? true;

  return {
    id: entry.id,
    entityId: entry.entityId,
    entityType,
    title: `${entityLabel(entityType)} — ${actionLabel(entityType, entry.action)}`,
    subject: subjectLine(entry),
    time: formatTime(entry.createdAt, locale.value),
    dayKey: new Date(entry.createdAt).toDateString(),
    dayLabel: dayLabel(entry.createdAt),
    color: actionColor(entry.action),
    icon: view.icon,
    valueDetails: [
      ...(details?.reason
        ? [
            {
              label: t('audit.reason'),
              value: reasonLabel(entityType, details.reason),
            },
          ]
        : []),
      ...Object.entries(values).map(([key, value]) => ({
        label: fieldLabel(entityType, key),
        value: displayValue(entityType, key, value),
      })),
    ],
    // A field already shown as "label: value" doesn't also need a bare chip.
    fieldLabels: (details?.changedFields ?? [])
      .filter((path) => !(path in values))
      .map((path) => fieldLabel(entityType, path, formFieldLabels.value)),
    actor: actorLabel(entry.actor, t('deletedUser')),
    openLabel: exists === true && view.open ? view.open.label() : null,
  };
}

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
.audit-log-content {
  max-width: 960px;
  padding-bottom: 24px;
}

.section-card {
  border-radius: 16px;
}

.empty-state {
  padding: 48px 16px;
}

.empty-icon {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}

.filter-row {
  gap: 8px;
}

.filter-chip {
  height: 32px;
  margin: 0;
  padding: 0 12px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 8px;

  background: transparent;
  color: var(--md3-on-surface-variant);

  font-size: 13px;
  font-weight: 500;
}

.filter-chip--active {
  border-color: transparent;
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.audit-entry__subject {
  color: var(--md3-primary);
}

.audit-entry__meta-side {
  align-items: flex-end;
  gap: 4px;
}

.audit-entry__id {
  color: var(--md3-on-surface-variant);
  font-family: monospace;
}

.audit-entry__time {
  color: var(--md3-on-surface-variant);
  font-size: 12px;
  white-space: nowrap;
}

.audit-entry__content {
  /* A flex item's default min-width is its content's intrinsic width, which
     ignores wrapping — without this, a long chip pushes the row wider than
     the card instead of wrapping inside it. */
  min-width: 0;
}

.audit-entry__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
  min-width: 0;
}

.audit-chip {
  height: 24px;
  min-width: 0;
  max-width: 100%;
  margin: 0;
  padding: 0 10px;
  border-radius: 8px;

  font-size: 12px;
  font-weight: 500;
}

.audit-chip :deep(.q-chip__content) {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.25;
}

.audit-chip--value {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.audit-chip--field {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Audit Log'
subtitle: 'A history of changes made to this event, its registrations, and its team.'
refresh: 'Refresh'
by: 'by {actor}'
bySystem: 'System event'
showHistory: 'Show full history of {id}'
deletedUser: 'Deleted user'
today: 'Today'
yesterday: 'Yesterday'
filter:
  label: 'Filter:'
  actor: 'Actor'
  showSystemEvents: 'Show system events'
  history: 'History of #{id}'
empty:
  title: 'No activity yet'
  message: 'Changes to this event will show up here.'
  filteredTitle: 'No matching events'
  filteredMessage: 'Try adjusting the filters above.'
error:
  load: 'Failed to load the audit log'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Aktivitätsprotokoll'
subtitle: 'Ein Verlauf der Änderungen an dieser Veranstaltung, ihren Anmeldungen und ihrem Team.'
refresh: 'Aktualisieren'
by: 'von {actor}'
bySystem: 'Systemereignis'
showHistory: 'Gesamten Verlauf von {id} anzeigen'
deletedUser: 'Gelöschter Benutzer'
today: 'Heute'
yesterday: 'Gestern'
filter:
  label: 'Filter:'
  actor: 'Ausgeführt von'
  showSystemEvents: 'Systemereignisse anzeigen'
  history: 'Verlauf von #{id}'
empty:
  title: 'Noch keine Aktivität'
  message: 'Änderungen an dieser Veranstaltung erscheinen hier.'
  filteredTitle: 'Keine passenden Ereignisse'
  filteredMessage: 'Passe die Filter oben an.'
error:
  load: 'Aktivitätsprotokoll konnte nicht geladen werden'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Journal d’activité'
subtitle: 'Un historique des modifications apportées à cet événement, ses inscriptions et son équipe.'
refresh: 'Actualiser'
by: 'par {actor}'
bySystem: 'Événement système'
showHistory: 'Afficher tout l’historique de {id}'
deletedUser: 'Utilisateur supprimé'
today: 'Aujourd’hui'
yesterday: 'Hier'
filter:
  label: 'Filtrer :'
  actor: 'Auteur'
  showSystemEvents: 'Afficher les événements système'
  history: 'Historique de #{id}'
empty:
  title: 'Aucune activité pour le moment'
  message: 'Les modifications apportées à cet événement apparaîtront ici.'
  filteredTitle: 'Aucun événement correspondant'
  filteredMessage: 'Essayez d’ajuster les filtres ci-dessus.'
error:
  load: 'Échec du chargement du journal d’activité'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Dziennik aktywności'
subtitle: 'Historia zmian w tym wydarzeniu, jego zgłoszeniach i zespole.'
refresh: 'Odśwież'
by: 'przez {actor}'
bySystem: 'Zdarzenie systemowe'
showHistory: 'Pokaż pełną historię {id}'
deletedUser: 'Usunięty użytkownik'
today: 'Dzisiaj'
yesterday: 'Wczoraj'
filter:
  label: 'Filtruj:'
  actor: 'Wykonawca'
  showSystemEvents: 'Pokaż zdarzenia systemowe'
  history: 'Historia #{id}'
empty:
  title: 'Brak aktywności'
  message: 'Zmiany w tym wydarzeniu będą się tutaj pojawiać.'
  filteredTitle: 'Brak pasujących zdarzeń'
  filteredMessage: 'Spróbuj dostosować powyższe filtry.'
error:
  load: 'Nie udało się załadować dziennika aktywności'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Deník aktivit'
subtitle: 'Historie změn této akce, jejích registrací a týmu.'
refresh: 'Obnovit'
by: 'od {actor}'
bySystem: 'Systémová událost'
showHistory: 'Zobrazit celou historii {id}'
deletedUser: 'Smazaný uživatel'
today: 'Dnes'
yesterday: 'Včera'
filter:
  label: 'Filtr:'
  actor: 'Provedl'
  showSystemEvents: 'Zobrazit systémové události'
  history: 'Historie #{id}'
empty:
  title: 'Zatím žádná aktivita'
  message: 'Změny této akce se zobrazí zde.'
  filteredTitle: 'Žádné odpovídající události'
  filteredMessage: 'Zkuste upravit filtry výše.'
error:
  load: 'Nepodařilo se načíst deník aktivit'
</i18n>
