<template>
  <page-state-handler
    :error="error"
    padding
    class="row justify-center"
  >
    <div
      v-if="!loading && filteredCamps.length === 0"
      class="absolute fit row justify-center"
    >
      <div class="text-center self-center text-h4">
        {{ t('no_data') }}
      </div>
    </div>

    <div class="column col-12 col-xl-8">
      <div class="q-pa-md row justify-evenly q-gutter-lg">
        <template v-if="loading">
          <camp-card-skeleton
            v-for="n in 6"
            :key="n"
            class="col-3"
          />
          <!-- class="col-xs-12 col-sm-6 col-md-4 col-lg-5 col-xl-2         -->
        </template>
        <template v-else>
          <camp-card
            v-for="camp in filteredCamps"
            :key="camp.id"
            :camp="camp"
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

const filteredCamps = computed<Camp[]>(() => {
  return campsStore.data ?? [];
});

const error = computed(() => {
  return campsStore.error;
});

const loading = computed<boolean>(() => {
  return campsStore.isLoading;
});
</script>

<i18n lang="yaml" locale="en">
no_data: 'No camps found matching your criteria.'
</i18n>
<i18n lang="yaml" locale="de">
no_data: 'Keine Camps gefunden, die diesen Kriterien entsprechen.'
</i18n>
<i18n lang="yaml" locale="fr">
no_data: "Aucun camp correspondant à ces critères n'a été trouvé."
</i18n>
<i18n lang="yaml" locale="pl">
no_data: 'Nie znaleziono obozów spełniających te kryteria.'
</i18n>
<i18n lang="yaml" locale="cs">
no_data: 'Nebyly nalezeny žádné tábory odpovídající těmto kritériím.'
</i18n>
