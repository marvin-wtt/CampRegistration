<template>
  <page-state-handler
    :error="error"
    :loading="isLoading"
    class="flex justify-center"
  >
    <edit-camp-form
      v-if="camp"
      v-model="camp"
      :loading="loading"
      mode="edit"
      @submit="onSubmit"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { Camp } from '@camp-registration/common/entities';
import { useRouter } from 'vue-router';
import EditCampForm from 'components/campManagement/settings/EditCampForm.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { storeToRefs } from 'pinia';
import PageStateHandler from 'components/common/PageStateHandler.vue';

const router = useRouter();

const loading = ref<boolean>(false);
const campStore = useCampDetailsStore();
const { data, error, isLoading } = storeToRefs(campStore);

campStore.fetchData();

const camp = ref<Camp | undefined>(data.value as Camp);

watch(data, (value) => {
  if (camp.value === undefined && value) {
    camp.value = data.value;
  }
});

async function onSubmit() {
  loading.value = true;
  const value: Camp | undefined = camp.value as Camp | undefined;

  if (value === undefined) {
    return;
  }

  const newCamp = await campStore.updateData(value);

  if (!newCamp) {
    loading.value = false;
    return;
  }

  return router.push({
    name: 'dashboard',
  });
}
</script>
