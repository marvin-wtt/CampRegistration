<template>
  <page-state-handler
    padding
    :error="rows.length === 0 ? error : null"
    class="audit-log-page row justify-center"
  >
    <div
      class="audit-log-content col-12 col-md-11 col-lg-10 column q-gutter-y-lg"
    >
      <div class="row items-start justify-between q-col-gutter-y-sm">
        <div class="col-12 col-sm">
          <div class="text-h5 text-weight-medium">
            {{ t('title') }}
          </div>
          <div class="text-body2 text-variant q-mt-xs">
            {{ t('subtitle') }}
          </div>
        </div>
        <div class="col-auto">
          <m-btn
            :label="t('refresh')"
            :loading="loading && rows.length > 0"
            icon="refresh"
            tonal
            primary
            no-caps
            @click="refresh"
          />
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <template v-if="historyEntityId">
          <q-chip
            removable
            class="filter-chip filter-chip--active"
            @remove="historyEntityId = null"
          >
            {{ t('filter.history', { id: shortId(historyEntityId) }) }}
          </q-chip>
        </template>

        <template v-else>
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
            :removable="!!dateRange"
            class="filter-chip"
            :class="{ 'filter-chip--active': !!dateRange }"
            @remove="dateRange = null"
          >
            <q-icon
              name="event"
              size="16px"
              class="q-mr-xs"
            />
            {{ dateRangeLabel ?? t('filter.date') }}
            <q-menu>
              <q-date
                :model-value="dateRange"
                mask="YYYY-MM-DD"
                range
                minimal
                @update:model-value="onDateRangeUpdate"
              />
            </q-menu>
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
        </template>
      </div>

      <div
        v-if="initialLoading"
        class="row justify-center q-py-xl"
      >
        <q-spinner
          color="primary"
          size="3em"
        />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="items.length === 0"
        class="empty-state column items-center justify-center"
      >
        <q-icon
          name="history"
          size="64px"
          class="empty-icon"
        />
        <div class="text-h6 q-mt-md">
          {{ filtered ? t('empty.filteredTitle') : t('empty.title') }}
        </div>
        <div class="text-body2 text-variant q-mt-xs text-center">
          {{ filtered ? t('empty.filteredMessage') : t('empty.message') }}
        </div>
      </div>

      <!-- Entries, grouped by day. One virtual item per day heading or entry;
           the entry rows draw their day's card between them. -->
      <q-virtual-scroll
        v-else
        ref="scroller"
        :items
        scroll-target="body"
        :virtual-scroll-item-size="76"
        @virtual-scroll="onVirtualScroll"
      >
        <template #default="{ item }: { item: AuditLogItem }">
          <div
            v-if="item.kind === 'day'"
            :key="item.key"
            class="audit-day text-subtitle2 text-weight-medium"
          >
            {{ item.label }}
          </div>

          <div
            v-else
            :key="item.key"
            class="audit-row"
            :class="{
              'audit-row--first': item.first,
              'audit-row--last': item.last,
            }"
          >
            <q-item
              :clickable="!!item.entry.openLabel"
              class="audit-entry"
              @click="openEntry(item.entry)"
            >
              <q-item-section
                avatar
                top
              >
                <q-avatar
                  size="36px"
                  class="audit-entry__avatar"
                  :style="avatarStyle(item.entry.color)"
                >
                  <q-icon
                    :name="item.entry.icon"
                    size="20px"
                  />
                </q-avatar>
              </q-item-section>

              <q-item-section class="audit-entry__content">
                <div class="audit-entry__title">{{ item.entry.title }}</div>

                <div class="audit-entry__meta">
                  <template v-if="item.entry.subject">
                    <span class="audit-entry__subject">
                      {{ item.entry.subject }}
                    </span>
                    <span aria-hidden="true">·</span>
                  </template>
                  <span>
                    {{
                      item.entry.actor
                        ? t('by', { actor: item.entry.actor })
                        : t('bySystem')
                    }}
                  </span>
                  <span
                    class="xs"
                    aria-hidden="true"
                    >·</span
                  >
                  <span class="xs">{{ item.entry.time }}</span>
                </div>

                <div
                  v-if="
                    item.entry.valueDetails.length ||
                    item.entry.fieldLabels.length
                  "
                  class="audit-entry__chips"
                >
                  <q-chip
                    v-for="(detail, index) in item.entry.valueDetails"
                    :key="`v${index.toString()}`"
                    dense
                    class="audit-chip audit-chip--value"
                  >
                    {{ detail.label }}: {{ detail.value }}
                  </q-chip>
                  <q-chip
                    v-for="(field, index) in item.entry.fieldLabels"
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
                class="audit-entry__side"
              >
                <span class="audit-entry__time gt-xs">
                  {{ item.entry.time }}
                </span>
                <m-btn
                  text
                  round
                  dense
                  size="sm"
                  icon="more_vert"
                  :aria-label="t('menu.label')"
                  class="audit-entry__menu"
                  @click.stop
                >
                  <q-menu>
                    <q-list style="min-width: 200px">
                      <q-item
                        v-close-popup
                        clickable
                        @click="historyEntityId = item.entry.entityId"
                      >
                        <q-item-section avatar>
                          <q-icon name="history" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ t('menu.history') }}</q-item-label>
                          <q-item-label
                            caption
                            class="audit-entry__id"
                          >
                            #{{ shortId(item.entry.entityId) }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item
                        v-close-popup
                        clickable
                        @click="copyId(item.entry.entityId)"
                      >
                        <q-item-section avatar>
                          <q-icon name="content_copy" />
                        </q-item-section>
                        <q-item-section>{{ t('menu.copyId') }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </m-btn>
              </q-item-section>

              <!-- Reserved on every row so the side column lines up. -->
              <q-item-section
                side
                class="gt-xs"
                :class="{ invisible: !item.entry.openLabel }"
              >
                <q-icon name="chevron_right" />
                <q-tooltip v-if="item.entry.openLabel">
                  {{ item.entry.openLabel }}
                </q-tooltip>
              </q-item-section>
            </q-item>
          </div>
        </template>

        <template #after>
          <div
            v-if="loadingMore"
            class="row justify-center q-py-md"
          >
            <q-spinner
              color="primary"
              size="2em"
            />
          </div>
        </template>
      </q-virtual-scroll>
    </div>
  </page-state-handler>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { copyToClipboard, useQuasar, type QVirtualScroll } from 'quasar';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  AUDIT_ENTITY_TYPES,
  type AuditActor,
  type AuditEntityType,
  type AuditLogEntry,
  type AuditLogQuery,
} from '@camp-registration/common/entities';
import { zonedInstant } from '@camp-registration/common/utils';
import { useAPIService } from '@/services/APIService';
import { useServerList } from '@/composables/serverList';
import { useAuditLabels } from '@/composables/audit/auditLabels';
import {
  type AuditLogDisplayEntry,
  type AuditLogItem,
  useAuditLogEntries,
} from '@/composables/audit/auditLogEntries';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { addDays, parseLocalDate } from '@/utils/date';
import { browserTimezone } from '@/utils/timezones';
import PageStateHandler from '@/components/common/PageStateHandler.vue';

type DateRange = { from: string; to: string };

// Quasar color name → MD3 color role, for the entry avatars.
const AVATAR_ROLES: Record<string, string> = {
  positive: 'positive',
  negative: 'error',
  primary: 'primary',
};

const { t, locale } = useI18n();
const route = useRoute();
const quasar = useQuasar();
const apiService = useAPIService();
const { entityLabel } = useAuditLabels();
const { data: event } = storeToRefs(useEventDetailsStore());

const eventId = computed(() => String(route.params.eventId));
const timeZone = computed(() => event.value?.timezone);

const selectedEntityTypes = ref<AuditEntityType[]>([]);
const selectedActorIds = ref<string[]>([]);
// Public/self-service actions (no actor) tend to dominate the trail — default
// to hiding them so manager/director activity isn't buried underneath.
const showSystemEvents = ref(false);
const dateRange = ref<DateRange | null>(null);
// Narrows the log to one record's full history, overriding the other filters.
const historyEntityId = ref<string | null>(null);

const filtered = computed(
  () =>
    !!historyEntityId.value ||
    selectedEntityTypes.value.length > 0 ||
    selectedActorIds.value.length > 0 ||
    !!dateRange.value,
);

// Whole days in the event's timezone, as the instants the API filters on.
function dateRangeQuery(range: DateRange | null): Partial<AuditLogQuery> {
  if (!range) {
    return {};
  }
  const zone = timeZone.value ?? browserTimezone();
  const endExclusive = zonedInstant(`${addDays(range.to, 1)}T00:00:00`, zone);
  return {
    from: zonedInstant(`${range.from}T00:00:00`, zone).toISOString(),
    to: new Date(endExclusive.getTime() - 1).toISOString(),
  };
}

const scroller = useTemplateRef<QVirtualScroll>('scroller');

const {
  rows,
  loading,
  initialLoading,
  loadingMore,
  error,
  hasMore,
  reload,
  loadMore,
} = useServerList<AuditLogEntry, AuditLogQuery>({
  watchSources: [
    selectedEntityTypes,
    selectedActorIds,
    showSystemEvents,
    dateRange,
    historyEntityId,
  ],
  onReset: () => scroller.value?.reset(),
  fetch: (query) => apiService.fetchEventAuditLog(eventId.value, query),
  buildQuery: ({ cursor, limit }) =>
    historyEntityId.value
      ? { cursor, limit, entityId: historyEntityId.value }
      : {
          cursor,
          limit,
          entityType: selectedEntityTypes.value.length
            ? selectedEntityTypes.value
            : undefined,
          actorId: selectedActorIds.value.length
            ? selectedActorIds.value
            : undefined,
          hideSystem: !showSystemEvents.value,
          ...dateRangeQuery(dateRange.value),
        },
});

const { items, loadEntityViews, open } = useAuditLogEntries(rows, timeZone);

const actors = ref<AuditActor[]>([]);

async function loadActors(): Promise<void> {
  actors.value = await apiService
    .fetchEventAuditActors(eventId.value)
    .catch(() => actors.value);
}

onMounted(() => {
  loadEntityViews(eventId.value);
  void loadActors();
});

// There's no live update yet, so new entries need an explicit reload.
function refresh(): void {
  reload();
  loadEntityViews(eventId.value);
  void loadActors();
}

function onVirtualScroll(details: { to: number }): void {
  if (hasMore.value && !loading.value && details.to >= items.value.length - 5) {
    void loadMore();
  }
}

// The random tail of the ULID — its head is a timestamp, shared by records
// created around the same time.
function shortId(id: string): string {
  return id.slice(-8);
}

async function copyId(id: string): Promise<void> {
  await copyToClipboard(id);
  quasar.notify({ type: 'positive', message: t('menu.idCopied') });
}

function openEntry(entry: AuditLogDisplayEntry): void {
  open(eventId.value, entry);
}

function avatarStyle(color: string): Record<string, string> {
  const role = AVATAR_ROLES[color] ?? 'primary';
  return {
    background: `var(--md3-${role}-container)`,
    color: `var(--md3-on-${role}-container)`,
  };
}

const entityTypeOptions = computed(() =>
  AUDIT_ENTITY_TYPES.map((entityType) => ({
    label: entityLabel(entityType),
    value: entityType,
  })),
);

const actorOptions = computed(() =>
  actors.value
    .map((actor) => ({
      label: actor.name ?? t('audit.deletedUser'),
      value: actor.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label)),
);

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

// QDate emits a plain date for a single-day pick and null when cleared.
function onDateRangeUpdate(value: DateRange | string | null): void {
  dateRange.value =
    typeof value === 'string' ? { from: value, to: value } : value;
}

const dateRangeLabel = computed<string | null>(() => {
  if (!dateRange.value) {
    return null;
  }
  const format = new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' });
  return format.formatRange(
    parseLocalDate(dateRange.value.from),
    parseLocalDate(dateRange.value.to),
  );
});
</script>

<style scoped>
.audit-log-content {
  max-width: 960px;
  padding-bottom: 24px;
}

.text-variant {
  color: var(--md3-on-surface-variant);
}

.empty-state {
  padding: 48px 16px;
}

.empty-icon {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* One swipeable row on phones instead of a pile of wrapped chips. */
@media (max-width: 599.98px) {
  .filter-row {
    flex-wrap: nowrap;
    margin-inline: -16px;
    padding-inline: 16px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .filter-chip {
    flex-shrink: 0;
  }
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

/* Spacing is padding, not margin: QVirtualScroll sizes items by offsetHeight. */
.audit-day {
  padding: 16px 0 4px;
}

.audit-row {
  border-inline: 1px solid var(--md3-outline-variant);
  border-top: 1px solid var(--md3-outline-variant);
  overflow: hidden;
}

.audit-row--first {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.audit-row--last {
  border-bottom: 1px solid var(--md3-outline-variant);
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}

.audit-entry {
  padding-block: 12px;
}

.audit-entry__title {
  color: var(--md3-on-surface);
  font-size: 15px;
  font-weight: 500;
}

.audit-entry__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
  color: var(--md3-on-surface-variant);
  font-size: 13px;
}

.audit-entry__subject {
  color: var(--md3-primary);
  font-weight: 500;
}

.audit-entry__side {
  align-items: flex-end;
  gap: 2px;
}

.audit-entry__time {
  color: var(--md3-on-surface-variant);
  font-size: 12px;
  white-space: nowrap;
}

.audit-entry__menu {
  color: var(--md3-on-surface-variant);
}

.audit-entry__id {
  font-family: monospace;
}

.audit-entry__content {
  /* Lets long chips wrap inside the row instead of widening it. */
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
menu:
  label: 'More actions'
  history: 'Show history'
  copyId: 'Copy ID'
  idCopied: 'ID copied'
filter:
  actor: 'Actor'
  date: 'Date'
  showSystemEvents: 'Show system events'
  history: 'History of #{id}'
empty:
  title: 'No activity yet'
  message: 'Changes to this event will show up here.'
  filteredTitle: 'No matching events'
  filteredMessage: 'Try adjusting the filters above.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Aktivitätsprotokoll'
subtitle: 'Ein Verlauf der Änderungen an dieser Veranstaltung, ihren Anmeldungen und ihrem Team.'
refresh: 'Aktualisieren'
by: 'von {actor}'
bySystem: 'Systemereignis'
menu:
  label: 'Weitere Aktionen'
  history: 'Verlauf anzeigen'
  copyId: 'ID kopieren'
  idCopied: 'ID kopiert'
filter:
  actor: 'Ausgeführt von'
  date: 'Datum'
  showSystemEvents: 'Systemereignisse anzeigen'
  history: 'Verlauf von #{id}'
empty:
  title: 'Noch keine Aktivität'
  message: 'Änderungen an dieser Veranstaltung erscheinen hier.'
  filteredTitle: 'Keine passenden Ereignisse'
  filteredMessage: 'Passe die Filter oben an.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Journal d’activité'
subtitle: 'Un historique des modifications apportées à cet événement, ses inscriptions et son équipe.'
refresh: 'Actualiser'
by: 'par {actor}'
bySystem: 'Événement système'
menu:
  label: 'Plus d’actions'
  history: 'Afficher l’historique'
  copyId: 'Copier l’ID'
  idCopied: 'ID copié'
filter:
  actor: 'Auteur'
  date: 'Date'
  showSystemEvents: 'Afficher les événements système'
  history: 'Historique de #{id}'
empty:
  title: 'Aucune activité pour le moment'
  message: 'Les modifications apportées à cet événement apparaîtront ici.'
  filteredTitle: 'Aucun événement correspondant'
  filteredMessage: 'Essayez d’ajuster les filtres ci-dessus.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Dziennik aktywności'
subtitle: 'Historia zmian w tym wydarzeniu, jego zgłoszeniach i zespole.'
refresh: 'Odśwież'
by: 'przez {actor}'
bySystem: 'Zdarzenie systemowe'
menu:
  label: 'Więcej akcji'
  history: 'Pokaż historię'
  copyId: 'Kopiuj ID'
  idCopied: 'Skopiowano ID'
filter:
  actor: 'Wykonawca'
  date: 'Data'
  showSystemEvents: 'Pokaż zdarzenia systemowe'
  history: 'Historia #{id}'
empty:
  title: 'Brak aktywności'
  message: 'Zmiany w tym wydarzeniu będą się tutaj pojawiać.'
  filteredTitle: 'Brak pasujących zdarzeń'
  filteredMessage: 'Spróbuj dostosować powyższe filtry.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Deník aktivit'
subtitle: 'Historie změn této akce, jejích registrací a týmu.'
refresh: 'Obnovit'
by: 'od {actor}'
bySystem: 'Systémová událost'
menu:
  label: 'Další akce'
  history: 'Zobrazit historii'
  copyId: 'Kopírovat ID'
  idCopied: 'ID zkopírováno'
filter:
  actor: 'Provedl'
  date: 'Datum'
  showSystemEvents: 'Zobrazit systémové události'
  history: 'Historie #{id}'
empty:
  title: 'Zatím žádná aktivita'
  message: 'Změny této akce se zobrazí zde.'
  filteredTitle: 'Žádné odpovídající události'
  filteredMessage: 'Zkuste upravit filtry výše.'
</i18n>
