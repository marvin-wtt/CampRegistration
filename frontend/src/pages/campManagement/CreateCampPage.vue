<template>
  <q-page
    class="flex justify-center"
    padding
  >
    <edit-camp-form
      v-model="data"
      :loading="loading"
      mode="create"
      @submit="onSubmit"
    />
  </q-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { Camp } from '@camp-registration/common/entities';
import { useCampsStore } from 'stores/camps-store';
import { useRouter } from 'vue-router';
import EditCampForm from 'components/campManagement/edit/EditCampForm.vue';

const router = useRouter();

const loading = ref<boolean>(false);
const data = ref<Partial<Camp>>({});
const campsStore = useCampsStore();

async function onSubmit() {
  loading.value = true;

  // TODO Replace with default
  data.value.form = {
    title: 'Test',
    description: 'Survey',
    pages: [],
  };

  const camp = await campsStore.createEntry(data.value as Camp);

  if (!camp) {
    loading.value = false;
    return;
  }

  return router.push({
    name: 'management',
    query: {
      public: 0,
    },
  });
}
</script>
