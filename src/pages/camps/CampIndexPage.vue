<template>
  <page-state-handler
    :error="error"
    :loading="loading"
    padding
    class="row justify-center"
  >
    <div class="col-12 col-md-10 col-lg-8 col-xl-6">
      <div class="q-pa-md row items-start q-gutter-md">
        <camp-card
          v-for="camp in filteredCamps"
          :key="camp.id"
          :camp="camp"
        />
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
