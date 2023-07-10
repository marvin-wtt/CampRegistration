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
import { Camp } from 'src/types/Camp';
import { useCampsStore } from 'stores/camps-store';
import { useRouter } from 'vue-router';
import EditCampForm from 'components/campManagement/edit/EditCampForm.vue';

const router = useRouter();

const loading = ref<boolean>(false);
const data = ref<Partial<Camp>>({});
const campsStore = useCampsStore();

async function onSubmit() {
  loading.value = true;
  await campsStore.createEntry(data.value as Camp);

  return router.push({
    name: 'camp-management',
    query: {
      public: 0,
    },
  });
}
</script>
