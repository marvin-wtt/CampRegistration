<template>
  <!-- Loading is handled with skeleton loading -->
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <div class="camp-mgmt col-12 col-md-11 col-lg-10 col-xl-8 column no-wrap">
      <!-- Header -->
      <div class="camp-mgmt__header row items-start justify-between no-wrap">
        <div class="col page-title">
          <div class="text-h5 text-weight-medium">
            {{ t('title') }}
          </div>
          <div class="camp-mgmt__subtitle text-body2 q-mt-xs">
            {{ t('subtitle') }}
          </div>
        </div>

        <q-btn
          :label="quasar.screen.gt.xs ? t('action.create') : ''"
          color="primary"
          icon="add"
          unelevated
          no-caps
          :round="quasar.screen.lt.sm"
          :rounded="quasar.screen.gt.xs"
          @click="onCreateCamp()"
        />
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="results-grid"
      >
        <camp-card-skeleton
          v-for="index in 6"
          :key="index"
        />
      </div>

      <!-- Empty -->
      <div
        v-else-if="totalCamps === 0"
        class="camp-mgmt__empty column items-center justify-center"
      >
        <q-icon
          name="cabin"
          size="64px"
          class="camp-mgmt__empty-icon"
        />
        <div class="text-h6 q-mt-md">
          {{ t('empty.title') }}
        </div>
        <div class="camp-mgmt__subtitle text-body2 q-mt-xs text-center">
          {{ t('empty.message') }}
        </div>
        <q-btn
          class="q-mt-lg"
          :label="t('action.create')"
          color="primary"
          icon="add"
          unelevated
          no-caps
          rounded
          @click="onCreateCamp()"
        />
      </div>

      <!-- Timeline groups -->
      <template v-else>
        <camp-card-section
          v-for="group in groups"
          :key="group.key"
          :header="group.header"
          :icon="group.icon"
          :camps="group.camps"
        />

        <camp-card-section
          v-if="archivedCamps.length"
          :header="t('group.archived')"
          icon="inventory_2"
          :hint="t('group.archivedHint')"
          :camps="archivedCamps"
          collapsible
        />
      </template>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, onMounted } from 'vue';
import type { Camp } from '@camp-registration/common/entities';
import { useAssignedCampsStore } from 'stores/assigned-camps-store';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import CampCardSection from 'components/campManagement/index/CampCardSection.vue';
import CampCardSkeleton from 'components/campManagement/index/CampCardSkeleton.vue';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import CampCreateDialog from 'components/campManagement/index/CampCreateDialog.vue';
import { phaseOf, type CampPhase } from 'src/utils/campPhase';

const { t } = useI18n();
const quasar = useQuasar();
const assignedCampsStore = useAssignedCampsStore();

const {
  data: camps,
  isLoading: loading,
  error,
} = storeToRefs(assignedCampsStore);

onMounted(() => void assignedCampsStore.fetchData());

const totalCamps = computed<number>(() => camps.value?.length ?? 0);

interface Group {
  key: Exclude<CampPhase, 'archived'>;
  header: string;
  icon: string;
  camps: Camp[];
}

const groups = computed<Group[]>(() => {
  const all = camps.value ?? [];

  const ongoing = all
    .filter((camp) => phaseOf(camp) === 'ongoing')
    .toSorted(byStartAsc);
  const upcoming = all
    .filter((camp) => phaseOf(camp) === 'upcoming')
    .toSorted(byStartAsc);
  const past = all
    .filter((camp) => phaseOf(camp) === 'past')
    .toSorted(byStartDesc);

  return [
    {
      key: 'ongoing' as const,
      header: t('group.ongoing'),
      icon: 'play_circle',
      camps: ongoing,
    },
    {
      key: 'upcoming' as const,
      header: t('group.upcoming'),
      icon: ' event',
      camps: upcoming,
    },
    {
      key: 'past' as const,
      header: t('group.past'),
      icon: 'history',
      camps: past,
    },
  ].filter((group) => group.camps.length > 0);
});

const archivedCamps = computed<Camp[]>(() => {
  return (camps.value ?? [])
    .filter((camp) => phaseOf(camp) === 'archived')
    .toSorted(byStartDesc);
});

function byStartAsc(a: Camp, b: Camp) {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

function byStartDesc(a: Camp, b: Camp) {
  return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
}

function onCreateCamp() {
  quasar.dialog({
    component: CampCreateDialog,
  });
}
</script>

<style scoped>
.camp-mgmt {
  min-width: 0;
}

/* Clear the floating toolbar so the title isn't crowded against it */
.camp-mgmt__header {
  gap: 16px;
  margin-top: 1rem;
}

.camp-mgmt__subtitle {
  color: var(--md3-on-surface-variant);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  align-items: stretch;

  margin-top: 28px;
}

.camp-mgmt__empty {
  padding: 64px 16px;
}

.camp-mgmt__empty-icon {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}
</style>

<i18n lang="yaml" locale="en">
title: 'My camps'
subtitle: 'Manage registrations, rooms and program for the camps you run.'
group:
  ongoing: 'Happening now'
  upcoming: 'Upcoming'
  past: 'Past'
  archived: 'Archived'
  archivedHint: 'Camps are archived automatically once they ended more than 6 weeks ago and registration is closed.'
action:
  create: 'Create camp'
empty:
  title: 'No camps yet'
  message: 'Create your first camp to start managing registrations, rooms and program.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Meine Camps'
subtitle: 'Verwalte Anmeldungen, Räume und Programm für die Camps, die du leitest.'
group:
  ongoing: 'Aktuell'
  upcoming: 'Anstehend'
  past: 'Vergangen'
  archived: 'Archiviert'
  archivedHint: 'Camps werden automatisch archiviert, wenn sie vor mehr als 6 Wochen endeten und die Anmeldung geschlossen ist.'
action:
  create: 'Camp erstellen'
empty:
  title: 'Noch keine Camps'
  message: 'Erstelle dein erstes Camp, um Anmeldungen, Räume und Programm zu verwalten.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Mes camps'
subtitle: 'Gérez les inscriptions, les chambres et le programme des camps que vous dirigez.'
group:
  ongoing: 'En cours'
  upcoming: 'À venir'
  past: 'Passés'
  archived: 'Archivés'
  archivedHint: 'Les camps sont archivés automatiquement lorsqu’ils se sont terminés il y a plus de 6 semaines et que les inscriptions sont closes.'
action:
  create: 'Créer un camp'
empty:
  title: 'Aucun camp pour le moment'
  message: 'Créez votre premier camp pour gérer les inscriptions, les chambres et le programme.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Moje obozy'
subtitle: 'Zarządzaj zapisami, pokojami i programem obozów, które prowadzisz.'
group:
  ongoing: 'Trwające'
  upcoming: 'Nadchodzące'
  past: 'Zakończone'
  archived: 'Zarchiwizowane'
  archivedHint: 'Obozy są archiwizowane automatycznie, gdy zakończyły się ponad 6 tygodni temu, a zapisy są zamknięte.'
action:
  create: 'Utwórz obóz'
empty:
  title: 'Brak obozów'
  message: 'Utwórz swój pierwszy obóz, aby zarządzać zapisami, pokojami i programem.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Moje tábory'
subtitle: 'Spravujte registrace, pokoje a program táborů, které vedete.'
group:
  ongoing: 'Probíhající'
  upcoming: 'Nadcházející'
  past: 'Minulé'
  archived: 'Archivované'
  archivedHint: 'Tábory se archivují automaticky, jakmile skončily před více než 6 týdny a registrace je uzavřena.'
action:
  create: 'Vytvořit tábor'
empty:
  title: 'Zatím žádné tábory'
  message: 'Vytvořte svůj první tábor a začněte spravovat registrace, pokoje a program.'
</i18n>
