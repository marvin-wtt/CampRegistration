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
          clickable
          class="filter-chip"
          :class="{ 'filter-chip--active': hideSystemEvents }"
          @click="hideSystemEvents = !hideSystemEvents"
        >
          {{ t('filter.hideSystemEvents') }}
          <q-icon
            v-if="hideSystemEvents"
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
                    <q-tooltip>
                      {{ t('entityId', { id: entry.entityId }) }}
                    </q-tooltip>
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
                    v-if="entry.entityType === 'registration'"
                    flat
                    round
                    dense
                    size="sm"
                    icon="open_in_new"
                    color="primary"
                    @click="viewRegistration(entry.entityId)"
                  >
                    <q-tooltip>{{ t('viewRegistration') }}</q-tooltip>
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
import type {
  AuditEntityType,
  AuditLogEntry,
  AuditValue,
} from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useAuditTimeline } from '@/composables/auditTimeline';
import { useAuditFieldLabels } from '@/composables/auditFieldLabels';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { formatPersonName } from '@/utils/formatters';
import { extractFormFields } from '@/utils/surveyJS';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import RegistrationDetailsDialog from '@/components/event/table/dialogs/RegistrationDetailsDialog.vue';

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

const eventId = computed(() => {
  const value = route.params.eventId;
  return typeof value === 'string' ? value : null;
});

// Question labels for `data.*`/`form.*` audit paths, from the event's current
// form (already kept up to date by the app-wide event-details store).
const { data: event } = storeToRefs(useEventDetailsStore());

// Live registration data, so a registration entry can show *which*
// registration it's about — the audit log itself never stores participant
// names, only field names (see `registrationSubject` below).
const registrationsStore = useRegistrationsStore();
const { fullName } = useRegistrationHelper();

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

  // Best-effort — a failure here only means registration entries fall back to
  // "Deleted registration" instead of naming who they're about; the page
  // itself still works.
  void registrationsStore.fetchData(eventId.value);
});

// Resolves a registration entry's live (current) name — the audit log itself
// never stores participant data, so this is the only way to say *which*
// registration an entry is about.
function registrationSubject(entityId: string): string {
  const registration = registrationsStore.data?.find((r) => r.id === entityId);
  if (!registration) {
    return t('deletedRegistration');
  }
  return formatPersonName(fullName(registration));
}

// Opens the registration's existing detail dialog with its current (live) data
// — the audit log itself never stores registration content, only field names.
// `RegistrationDetailsDialog` reads the registration reactively from the
// store rather than a passed-in snapshot, so it must be loaded first.
async function viewRegistration(registrationId: string): Promise<void> {
  if (!eventId.value) {
    return;
  }

  try {
    await registrationsStore.fetchData(eventId.value);
  } catch {
    // fetchData already records the error on the store; fall through to the
    // not-found check below, which will report it.
  }

  const exists = registrationsStore.data?.some((r) => r.id === registrationId);
  if (!exists) {
    quasar.notify({ type: 'negative', message: t('error.registrationGone') });
    return;
  }

  quasar.dialog({
    component: RegistrationDetailsDialog,
    componentProps: { registrationId },
  });
}

// All possible entity types, not just the ones present in the current data —
// otherwise a type disappears from the filter once nothing of it remains.
const ENTITY_TYPES: AuditEntityType[] = [
  'event',
  'registration',
  'eventManager',
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
const hideSystemEvents = ref(true);

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
    if (
      selectedEntityTypes.value.length > 0 &&
      !selectedEntityTypes.value.includes(entry.entityType)
    ) {
      return false;
    }
    if (entry.actor === null) {
      return !hideSystemEvents.value && selectedActorIds.value.length === 0;
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
  subject:
    entry.entityType === 'registration'
      ? registrationSubject(entry.entityId)
      : actorLabel(entry.subject, t('deletedUser')),
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
by: 'by {actor}'
bySystem: 'System event'
entityId: 'ID: {id}'
viewRegistration: 'View registration'
deletedUser: 'Deleted user'
deletedRegistration: 'Deleted registration'
today: 'Today'
yesterday: 'Yesterday'
filter:
  label: 'Filter:'
  actor: 'Actor'
  hideSystemEvents: 'Hide system events'
empty:
  title: 'No activity yet'
  message: 'Changes to this event will show up here.'
  filteredTitle: 'No matching events'
  filteredMessage: 'Try adjusting the filters above.'
error:
  load: 'Failed to load the audit log'
  registrationGone: 'This registration no longer exists'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Aktivitätsprotokoll'
subtitle: 'Ein Verlauf der Änderungen an dieser Veranstaltung, ihren Anmeldungen und ihrem Team.'
by: 'von {actor}'
bySystem: 'Systemereignis'
entityId: 'ID: {id}'
viewRegistration: 'Anmeldung ansehen'
deletedUser: 'Gelöschter Benutzer'
deletedRegistration: 'Gelöschte Anmeldung'
today: 'Heute'
yesterday: 'Gestern'
filter:
  label: 'Filter:'
  actor: 'Ausgeführt von'
  hideSystemEvents: 'Systemereignisse ausblenden'
empty:
  title: 'Noch keine Aktivität'
  message: 'Änderungen an dieser Veranstaltung erscheinen hier.'
  filteredTitle: 'Keine passenden Ereignisse'
  filteredMessage: 'Passe die Filter oben an.'
error:
  load: 'Aktivitätsprotokoll konnte nicht geladen werden'
  registrationGone: 'Diese Anmeldung existiert nicht mehr'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Journal d’activité'
subtitle: 'Un historique des modifications apportées à cet événement, ses inscriptions et son équipe.'
by: 'par {actor}'
bySystem: 'Événement système'
entityId: 'ID : {id}'
viewRegistration: 'Voir l’inscription'
deletedUser: 'Utilisateur supprimé'
deletedRegistration: 'Inscription supprimée'
today: 'Aujourd’hui'
yesterday: 'Hier'
filter:
  label: 'Filtrer :'
  actor: 'Auteur'
  hideSystemEvents: 'Masquer les événements système'
empty:
  title: 'Aucune activité pour le moment'
  message: 'Les modifications apportées à cet événement apparaîtront ici.'
  filteredTitle: 'Aucun événement correspondant'
  filteredMessage: 'Essayez d’ajuster les filtres ci-dessus.'
error:
  load: 'Échec du chargement du journal d’activité'
  registrationGone: 'Cette inscription n’existe plus'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Dziennik aktywności'
subtitle: 'Historia zmian w tym wydarzeniu, jego zgłoszeniach i zespole.'
by: 'przez {actor}'
bySystem: 'Zdarzenie systemowe'
entityId: 'ID: {id}'
viewRegistration: 'Zobacz zgłoszenie'
deletedUser: 'Usunięty użytkownik'
deletedRegistration: 'Usunięte zgłoszenie'
today: 'Dzisiaj'
yesterday: 'Wczoraj'
filter:
  label: 'Filtruj:'
  actor: 'Wykonawca'
  hideSystemEvents: 'Ukryj zdarzenia systemowe'
empty:
  title: 'Brak aktywności'
  message: 'Zmiany w tym wydarzeniu będą się tutaj pojawiać.'
  filteredTitle: 'Brak pasujących zdarzeń'
  filteredMessage: 'Spróbuj dostosować powyższe filtry.'
error:
  load: 'Nie udało się załadować dziennika aktywności'
  registrationGone: 'To zgłoszenie już nie istnieje'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Deník aktivit'
subtitle: 'Historie změn této akce, jejích registrací a týmu.'
by: 'od {actor}'
bySystem: 'Systémová událost'
entityId: 'ID: {id}'
viewRegistration: 'Zobrazit registraci'
deletedUser: 'Smazaný uživatel'
deletedRegistration: 'Smazaná registrace'
today: 'Dnes'
yesterday: 'Včera'
filter:
  label: 'Filtr:'
  actor: 'Provedl'
  hideSystemEvents: 'Skrýt systémové události'
empty:
  title: 'Zatím žádná aktivita'
  message: 'Změny této akce se zobrazí zde.'
  filteredTitle: 'Žádné odpovídající události'
  filteredMessage: 'Zkuste upravit filtry výše.'
error:
  load: 'Nepodařilo se načíst deník aktivit'
  registrationGone: 'Tato registrace již neexistuje'
</i18n>
