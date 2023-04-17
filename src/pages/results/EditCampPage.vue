<template>
  <page-state-handler
    :error="error"
    :loading="isLoading"
  >
    <edit-camp-form
      v-model="camp"
      :loading="loading"
      mode="edit"
      @submit="onSubmit"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Camp } from 'src/types/Camp';
import { useRouter } from 'vue-router';
import EditCampForm from 'components/results/EditCampForm.vue';
import { useCampDetailsStore } from 'stores/camp/camp-details-store';
import { storeToRefs } from 'pinia';
import PageStateHandler from 'components/PageStateHandler.vue';

const router = useRouter();

const loading = ref<boolean>(false);
const campsStore = useCampDetailsStore();
const { data, error, isLoading } = storeToRefs(campsStore);

const camp = ref<Camp | undefined>(data.value);

watch(data, (value) => {
  if (camp.value === undefined && value) {
    camp.value = data.value;
  }
});

async function onSubmit() {
  loading.value = true;

  const value = camp.value;

  if (value === undefined) {
    return;
  }

  await campsStore.updateData(value);

  return router.push({
    name: 'results-dashboard',
    query: {
      public: 0,
    },
  });
}
</script>
