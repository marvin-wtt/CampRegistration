<template>
  <page-state-handler
    :error="error"
    padding
    class="row justify-center"
  >
    <div
      v-if="!loading && filteredCamps.length === 0"
      class="class=&quot;absolute fit row justify-center&quot;"
    >
      <div class="text-center self-center text-h1">
        {{ t('no_data') }}
      </div>
    </div>

    <div class="col-12 col-md-10 col-lg-8 col-xl-8">
      <div class="q-pa-md row items-start q-gutter-md">
        <template v-if="loading">
          <div
            v-for="n in 5"
            :key="n"
            class="col"
          >
            <camp-card-skeleton />
          </div>
        </template>
        <template v-else>
          <div
            v-for="camp in filteredCamps"
            :key="camp.id"
            class="col"
          >
            <camp-card :camp="camp" />
          </div>
        </template>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useCampsStore } from 'stores/camps-store';
import { computed } from 'vue';
import { Camp } from 'src/types/Camp';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import CampCard from 'components/camps/CampCard.vue';
import CampCardSkeleton from 'components/camps/CampCardSkeleton.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const campsStore = useCampsStore();

campsStore.fetchData();

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
no_data: 'No camps found'
</i18n>
<i18n lang="yaml" locale="de">
no_data: 'Keine Camps gefunden'
</i18n>
<i18n lang="yaml" locale="fr">
no_data: "Aucun camp n'a été trouvé"
</i18n>
