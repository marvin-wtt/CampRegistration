<template>
  <page-state-handler
    :error="error"
    :loading="isLoading"
    class="flex justify-center"
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
import EditCampForm from 'components/campManagement/edit/EditCampForm.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { storeToRefs } from 'pinia';
import PageStateHandler from 'components/common/PageStateHandler.vue';

const router = useRouter();

const loading = ref<boolean>(false);
const campsStore = useCampDetailsStore();
const { data, error, isLoading } = storeToRefs(campsStore);

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

  await campsStore.updateData(value);

  return router.push({
    name: 'dashboard',
    query: {
      public: 0,
    },
  });
}
</script>
