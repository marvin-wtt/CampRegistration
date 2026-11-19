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
          <retention-status-chip
            :status="entry.status"
            :postponed="entry.postponed"
            class="q-mt-xs"
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
import type { RetentionOverviewEntry } from '@camp-registration/common/privacy';
import { useObjectTranslation } from '@/composables/objectTranslation';
import RetentionStatusChip from '@/components/retention/RetentionStatusChip.vue';

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
</script>

<style lang="scss" scoped></style>

<i18n lang="yaml" locale="en">
title: 'Retention deadlines'
empty: 'No deadline is due within the next 30 days.'
summary:
  none: 'Nothing due'
  overdue: '{n} overdue | {n} overdue'
  dueSoon: '{n} due soon | {n} due soon'
kind:
  sensitive: 'Sensitive data'
  registrations: 'All registration data'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Speicherfristen'
empty: 'In den nächsten 30 Tagen ist keine Frist fällig.'
summary:
  none: 'Nichts fällig'
  overdue: '{n} überfällig | {n} überfällig'
  dueSoon: '{n} bald fällig | {n} bald fällig'
kind:
  sensitive: 'Sensible Daten'
  registrations: 'Alle Anmeldedaten'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Délais de conservation'
empty: 'Aucun délai n’arrive à échéance dans les 30 prochains jours.'
summary:
  none: 'Rien à traiter'
  overdue: '{n} en retard | {n} en retard'
  dueSoon: '{n} bientôt | {n} bientôt'
kind:
  sensitive: 'Données sensibles'
  registrations: 'Toutes les données d’inscription'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Terminy przechowywania'
empty: 'W ciągu najbliższych 30 dni nie upływa żaden termin.'
summary:
  none: 'Nic do zrobienia'
  overdue: '{n} po terminie | {n} po terminie'
  dueSoon: '{n} wkrótce | {n} wkrótce'
kind:
  sensitive: 'Dane wrażliwe'
  registrations: 'Wszystkie dane zgłoszeń'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Lhůty uchování'
empty: 'V příštích 30 dnech nevyprší žádná lhůta.'
summary:
  none: 'Nic k vyřízení'
  overdue: '{n} po lhůtě | {n} po lhůtě'
  dueSoon: '{n} brzy | {n} brzy'
kind:
  sensitive: 'Citlivé údaje'
  registrations: 'Všechny údaje z přihlášek'
</i18n>
