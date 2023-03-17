<template>
  <page-state-handler
    :error="campDetails.error.value"
    :loading="campDetails.isLoading.value"
  >
    <edit-camp-form
      v-model="data"
      :loading="loading"
      mode="edit"
      @submit="onSubmit"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Camp } from 'src/types/Camp';
import { useRouter } from 'vue-router';
import EditCampForm from 'components/results/EditCampForm.vue';
import { useCampDetailsStore } from 'stores/camp/camp-details-store';
import { storeToRefs } from 'pinia';
import PageStateHandler from 'components/PageStateHandler.vue';

const router = useRouter();

const loading = ref<boolean>(false);
const campsStore = useCampDetailsStore();
const campDetails = storeToRefs(campsStore);

const data = ref<Camp | undefined>(campDetails.data.value);

async function onSubmit() {
  loading.value = true;

  if (data.value === undefined) {
    return;
  }

  await campsStore.updateData(data.value);

  return router.push({
    name: 'results-dashboard',
    query: {
      public: 0,
    },
  });
}
</script>
