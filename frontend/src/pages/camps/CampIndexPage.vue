<template>
  <page-state-handler
    :error="error"
    padding
    class="row justify-center"
  >
    <div class="camp-index col-12 col-md-11 col-lg-10 col-xl-8 column no-wrap">
      <!-- Header -->
      <div class="camp-index__header">
        <div class="row items-center no-wrap q-gutter-x-sm">
          <div class="text-h5 text-weight-medium">
            {{ t('title') }}
          </div>
          <q-badge
            v-if="!loading"
            rounded
            class="count-badge"
            :label="filteredCamps.length"
          />
        </div>
        <div class="camp-index__subtitle text-body2 q-mt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="!loading && filteredCamps.length === 0"
        class="empty-state col column items-center justify-center"
      >
        <q-icon
          name="travel_explore"
          size="64px"
          class="empty-icon"
        />
        <div class="text-h6 q-mt-md">
          {{ t('empty.title') }}
        </div>
        <div class="camp-index__subtitle text-body2 q-mt-xs text-center">
          {{ t('empty.message') }}
        </div>
      </div>

      <!-- Camps -->
      <div
        v-else
        class="camp-grid"
      >
        <template v-if="loading">
          <camp-card-skeleton
            v-for="n in 6"
            :key="n"
          />
        </template>
        <template v-else>
          <camp-card
            v-for="(camp, index) in filteredCamps"
            :key="camp.id"
            :camp
            class="camp-grid__item"
            :style="{ '--index': index }"
          />
        </template>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useCampsStore } from 'stores/camps-store';
import { computed, onMounted } from 'vue';
import type { Camp } from '@camp-registration/common/entities';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import CampCard from 'components/camps/CampCard.vue';
import CampCardSkeleton from 'components/camps/CampCardSkeleton.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const campsStore = useCampsStore();

onMounted(async () => {
  await Promise.allSettled([campsStore.fetchData()]);
});

function isRegistrationOpen(camp: Camp): boolean {
  if (!camp.registrationOpensAt && !camp.registrationClosesAt) {
    return false;
  }
  const now = new Date();
  return (
    (!camp.registrationOpensAt || now >= new Date(camp.registrationOpensAt)) &&
    (!camp.registrationClosesAt || now <= new Date(camp.registrationClosesAt))
  );
}

const filteredCamps = computed<Camp[]>(() => {
  return (campsStore.data ?? []).filter(isRegistrationOpen);
});

const error = computed(() => {
  return campsStore.error;
});

const loading = computed<boolean>(() => {
  return campsStore.isLoading;
});
</script>

<style scoped>
.camp-index {
  min-width: 0;
}

/* Clear the floating toolbar so the title isn't crowded against it */
.camp-index__header {
  margin-top: 1rem;
}

.camp-index__subtitle {
  color: var(--md3-on-surface-variant);
}

.count-badge {
  min-width: 20px;
  padding: 2px 8px;
  justify-content: center;

  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);

  font-size: 12px;
  font-weight: 600;
}

.camp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 16px;
  align-items: stretch;

  margin-top: 24px;
}

.camp-grid__item {
  animation: card-in 0.35s cubic-bezier(0.2, 0, 0, 1) both;
  animation-delay: calc(min(var(--index), 8) * 40ms);
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .camp-grid__item {
    animation: none;
  }
}

.empty-state {
  padding: 48px 16px;
}

.empty-icon {
  color: var(--md3-on-surface-variant);

  opacity: 0.6;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Find your camp'
subtitle: 'These camps are currently open for registration.'
empty:
  title: 'No camps open right now'
  message: 'Check back soon — new camps will appear here as soon as registration opens.'
</i18n>
<i18n lang="yaml" locale="de">
title: 'Finde dein Camp'
subtitle: 'Diese Camps sind derzeit zur Anmeldung geöffnet.'
empty:
  title: 'Aktuell sind keine Camps geöffnet'
  message: 'Schau bald wieder vorbei – neue Camps erscheinen hier, sobald die Anmeldung beginnt.'
</i18n>
<i18n lang="yaml" locale="fr">
title: 'Trouve ton camp'
subtitle: 'Ces camps sont actuellement ouverts aux inscriptions.'
empty:
  title: 'Aucun camp ouvert pour le moment'
  message: "Reviens bientôt – les nouveaux camps apparaîtront ici dès l'ouverture des inscriptions."
</i18n>
<i18n lang="yaml" locale="pl">
title: 'Znajdź swój obóz'
subtitle: 'Te obozy są obecnie otwarte na zapisy.'
empty:
  title: 'Obecnie brak otwartych obozów'
  message: 'Zajrzyj wkrótce – nowe obozy pojawią się tutaj, gdy tylko rozpoczną się zapisy.'
</i18n>
<i18n lang="yaml" locale="cs">
title: 'Najdi svůj tábor'
subtitle: 'Tyto tábory jsou právě otevřené k registraci.'
empty:
  title: 'Momentálně nejsou otevřené žádné tábory'
  message: 'Zastav se brzy znovu – nové tábory se zde objeví, jakmile se otevře registrace.'
</i18n>
