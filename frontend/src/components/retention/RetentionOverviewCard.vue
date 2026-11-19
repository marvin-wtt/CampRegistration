<template>
  <!-- Open retention deadlines across events: dates and kinds only, never
       registration data or postponement reasons. Read-only; the event's
       managers act on them from its dashboard. -->
  <q-card
    flat
    bordered
    class="retention-overview rounded-lg"
  >
    <q-card-section class="row items-center no-wrap q-gutter-x-md">
      <q-icon
        name="auto_delete"
        size="22px"
        class="text-primary"
      />
      <div class="col">
        <div class="text-subtitle1 text-weight-medium">{{ t('title') }}</div>
        <div class="text-caption text-on-surface-variant">
          {{ summary }}
        </div>
      </div>
    </q-card-section>

    <q-list
      v-if="loading"
      class="q-pb-sm"
    >
      <q-item
        v-for="width in ['70%', '55%']"
        :key="width"
      >
        <q-item-section>
          <q-skeleton
            type="text"
            :width="width"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <q-list
      v-else-if="visible.length > 0"
      separator
      class="q-pb-sm"
    >
      <q-item
        v-for="entry in visible"
        :key="entry.deadlineId"
        :to="eventLink ? eventLink(entry) : undefined"
        :clickable="!!eventLink"
      >
        <q-item-section>
          <q-item-label>{{ to(entry.eventName) }}</q-item-label>
          <q-item-label caption>
            <template v-if="showOrganization"
              >{{ entry.organizationName }} ·
            </template>
            {{ t(`kind.${entry.kind}`) }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label>{{ d(entry.effectiveAt, 'date') }}</q-item-label>
          <q-chip
            dense
            square
            class="status-chip"
            :color="STATUS_COLORS[entry.status].color"
            :text-color="STATUS_COLORS[entry.status].textColor"
            :label="
              t(`status.${entry.status}`) +
              (entry.postponed ? ` · ${t('postponed')}` : '')
            "
          />
        </q-item-section>
      </q-item>
    </q-list>

    <q-card-section
      v-else
      class="q-pt-none text-body2 text-on-surface-variant"
    >
      {{ t('empty') }}
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import type {
  RetentionDeadlineStatus,
  RetentionOverviewEntry,
} from '@camp-registration/common/privacy';
import { useObjectTranslation } from '@/composables/objectTranslation';

const props = defineProps<{
  entries: RetentionOverviewEntry[];
  loading?: boolean;
  showOrganization?: boolean;
  eventLink?: (entry: RetentionOverviewEntry) => RouteLocationRaw;
}>();

const { t, d } = useI18n();
const { to } = useObjectTranslation();

// Far-off deadlines are not news; overdue and due-soon ones lead.
const visible = computed(() =>
  props.entries.filter((entry) => entry.status !== 'upcoming'),
);

const summary = computed(() => {
  const overdue = props.entries.filter((e) => e.status === 'overdue').length;
  const dueSoon = props.entries.filter((e) => e.status === 'due_soon').length;
  if (overdue === 0 && dueSoon === 0) {
    return t('summary.none');
  }
  return [
    overdue ? t('summary.overdue', overdue) : null,
    dueSoon ? t('summary.dueSoon', dueSoon) : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');
});

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
.status-chip {
  margin: 0;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Retention deadlines'
empty: 'No deadline is due within the next 30 days.'
postponed: 'postponed'
summary:
  none: 'Nothing due'
  overdue: '{n} overdue | {n} overdue'
  dueSoon: '{n} due soon | {n} due soon'
kind:
  sensitive: 'Sensitive data'
  registrations: 'All registration data'
status:
  upcoming: 'Upcoming'
  due_soon: 'Due soon'
  overdue: 'Overdue'
  resolved: 'Deleted'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Speicherfristen'
empty: 'In den nächsten 30 Tagen ist keine Frist fällig.'
postponed: 'verschoben'
summary:
  none: 'Nichts fällig'
  overdue: '{n} überfällig | {n} überfällig'
  dueSoon: '{n} bald fällig | {n} bald fällig'
kind:
  sensitive: 'Sensible Daten'
  registrations: 'Alle Anmeldedaten'
status:
  upcoming: 'Anstehend'
  due_soon: 'Bald fällig'
  overdue: 'Überfällig'
  resolved: 'Gelöscht'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Délais de conservation'
empty: 'Aucun délai n’arrive à échéance dans les 30 prochains jours.'
postponed: 'reporté'
summary:
  none: 'Rien à traiter'
  overdue: '{n} en retard | {n} en retard'
  dueSoon: '{n} bientôt | {n} bientôt'
kind:
  sensitive: 'Données sensibles'
  registrations: 'Toutes les données d’inscription'
status:
  upcoming: 'À venir'
  due_soon: 'Bientôt'
  overdue: 'En retard'
  resolved: 'Supprimé'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Terminy przechowywania'
empty: 'W ciągu najbliższych 30 dni nie upływa żaden termin.'
postponed: 'przesunięty'
summary:
  none: 'Nic do zrobienia'
  overdue: '{n} po terminie | {n} po terminie'
  dueSoon: '{n} wkrótce | {n} wkrótce'
kind:
  sensitive: 'Dane wrażliwe'
  registrations: 'Wszystkie dane zgłoszeń'
status:
  upcoming: 'Nadchodzący'
  due_soon: 'Wkrótce'
  overdue: 'Po terminie'
  resolved: 'Usunięte'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Lhůty uchování'
empty: 'V příštích 30 dnech nevyprší žádná lhůta.'
postponed: 'odloženo'
summary:
  none: 'Nic k vyřízení'
  overdue: '{n} po lhůtě | {n} po lhůtě'
  dueSoon: '{n} brzy | {n} brzy'
kind:
  sensitive: 'Citlivé údaje'
  registrations: 'Všechny údaje z přihlášek'
status:
  upcoming: 'Nadcházející'
  due_soon: 'Brzy'
  overdue: 'Po lhůtě'
  resolved: 'Smazáno'
</i18n>
