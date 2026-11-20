<template>
  <q-card
    flat
    bordered
    class="retention-card"
  >
    <q-card-section>
      <dashboard-card-header
        :icon="allResolved ? 'verified_user' : 'auto_delete'"
        :tone="headerTone"
        :title="t('title')"
        :caption="caption"
        :link="
          canManage
            ? {
                label: t('manage'),
                to: { name: 'management.event.settings.data' },
              }
            : undefined
        "
      />
    </q-card-section>

    <q-card-section
      v-if="loading"
      class="q-pt-none"
    >
      <q-skeleton
        v-for="width in ['80%', '65%']"
        :key="width"
        type="text"
        :width="width"
      />
    </q-card-section>

    <q-card-section
      v-else-if="error"
      class="q-pt-none text-body2 text-error"
    >
      {{ t('loadError') }}
    </q-card-section>

    <q-card-section
      v-else-if="retention && retention.deadlines.length > 0"
      class="q-pt-none column q-gutter-y-sm"
    >
      <div
        v-for="deadline in retention.deadlines"
        :key="deadline.id"
        class="deadline rounded-lg"
        :data-test="`retention-${deadline.kind}`"
      >
        <div class="row items-center no-wrap q-gutter-x-sm">
          <div class="col">
            <div class="text-body2 text-weight-medium">
              {{ t(`kind.${deadline.kind}`) }}
            </div>
            <div class="text-caption text-on-surface-variant">
              <retention-date-line :deadline />
            </div>
          </div>
          <retention-status-chip :status="deadline.status" />
        </div>
      </div>
      <p class="text-caption text-on-surface-variant q-mb-none">
        {{ t('noAutomaticDeletion') }}
      </p>
    </q-card-section>

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
import { storeToRefs } from 'pinia';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import RetentionDateLine from '@/components/retention/RetentionDateLine.vue';
import RetentionStatusChip from '@/components/retention/RetentionStatusChip.vue';
import { useEventRetentionStore } from '@/stores/event-retention-store';
import { usePermissions } from '@/composables/permissions';

const { t, d } = useI18n();
const { canAccess } = usePermissions();
const retentionStore = useEventRetentionStore();
const {
  data: retention,
  isLoading: loading,
  error,
} = storeToRefs(retentionStore);

const canManage = computed(() =>
  canAccess({ any: ['event.registrations.delete', 'event.delete'] }),
);

void retentionStore.fetchData();

const allResolved = computed(
  () =>
    !!retention.value?.deadlines.length &&
    retention.value.deadlines.every(
      (deadline) => deadline.status === 'resolved',
    ),
);

const headerTone = computed(() => {
  const statuses = retention.value?.deadlines.map((d) => d.status) ?? [];
  if (statuses.includes('overdue') || statuses.includes('due_soon')) {
    return 'warning';
  }
  return allResolved.value ? 'positive' : 'primary';
});

const caption = computed(() => {
  const open = retention.value?.deadlines.filter(
    (deadline) => deadline.status !== 'resolved',
  );
  if (!open?.length) {
    return allResolved.value ? t('caption.done') : undefined;
  }
  const next = open[0];
  return next ? t('caption.next', { date: d(next.effectiveAt, 'date') }) : '';
});
</script>

<style lang="scss" scoped>
.deadline {
  padding: 0.75rem 1rem;
  background-color: var(--md3-surface-container);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Data retention'
empty: 'No deadline yet. Details and deletion under Settings › Data & deletion.'
manage: 'Manage'
caption:
  next: 'Next deadline: {date}'
  done: 'All registration data has been deleted.'
kind:
  sensitive: 'Health and other sensitive details'
  registrations: 'All registration data'
noAutomaticDeletion: 'Nothing is deleted automatically. Deleting is permanent and cannot be undone.'
loadError: 'Could not load the retention deadlines'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Speicherfristen'
empty: 'Noch keine Frist. Details und Löschen unter Einstellungen › Daten & Löschung.'
manage: 'Verwalten'
caption:
  next: 'Nächste Frist: {date}'
  done: 'Alle Anmeldedaten wurden gelöscht.'
kind:
  sensitive: 'Gesundheitsangaben und andere sensible Daten'
  registrations: 'Alle Anmeldedaten'
noAutomaticDeletion: 'Es wird nichts automatisch gelöscht. Löschen ist endgültig und kann nicht rückgängig gemacht werden.'
loadError: 'Die Speicherfristen konnten nicht geladen werden'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Conservation des données'
empty: 'Pas encore de délai. Détails et suppression sous Paramètres › Données et suppression.'
manage: 'Gérer'
caption:
  next: 'Prochain délai : {date}'
  done: 'Toutes les données d’inscription ont été supprimées.'
kind:
  sensitive: 'Données de santé et autres données sensibles'
  registrations: 'Toutes les données d’inscription'
noAutomaticDeletion: 'Rien n’est supprimé automatiquement. La suppression est définitive.'
loadError: 'Impossible de charger les délais de conservation'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Przechowywanie danych'
empty: 'Brak terminu. Szczegóły i usuwanie w Ustawienia › Dane i usuwanie.'
manage: 'Zarządzaj'
caption:
  next: 'Najbliższy termin: {date}'
  done: 'Wszystkie dane zgłoszeń zostały usunięte.'
kind:
  sensitive: 'Dane o zdrowiu i inne dane wrażliwe'
  registrations: 'Wszystkie dane zgłoszeń'
noAutomaticDeletion: 'Nic nie jest usuwane automatycznie. Usunięcie jest trwałe i nieodwracalne.'
loadError: 'Nie udało się wczytać terminów przechowywania'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Uchovávání údajů'
empty: 'Zatím bez lhůty. Podrobnosti a mazání v Nastavení › Údaje a mazání.'
manage: 'Spravovat'
caption:
  next: 'Nejbližší lhůta: {date}'
  done: 'Všechny údaje z přihlášek byly smazány.'
kind:
  sensitive: 'Zdravotní a další citlivé údaje'
  registrations: 'Všechny údaje z přihlášek'
noAutomaticDeletion: 'Nic se nemaže automaticky. Smazání je trvalé a nelze ho vrátit.'
loadError: 'Lhůty uchování se nepodařilo načíst'
</i18n>
