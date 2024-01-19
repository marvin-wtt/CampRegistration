<template>
  <page-state-handler
    :loading="loading"
    :error="error"
    class="row justify-center"
    :style="{ backgroundColor: bgColor }"
  >
    <registration-form
      v-if="campData"
      :camp-details="campData"
      :submit-fn="submit"
      :upload-file-fn="uploadFile"
      class="col-xs-12 col-sm-12 col-md-8 col-lg-6 col-xl-6"
      @bg-color-update="(color) => updateBgColor(color)"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { computed, onMounted, ref } from 'vue';
import { useMeta } from 'quasar';
import { useRegistrationsStore } from 'stores/registration-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { storeToRefs } from 'pinia';
import RegistrationForm from 'components/common/RegistrationForm.vue';

const { to } = useObjectTranslation();
const registrationStore = useRegistrationsStore();
const campDetailsStore = useCampDetailsStore();
const { data: campData } = storeToRefs(campDetailsStore);

const bgColor = ref<string>();

useMeta(() => {
  return {
    title: to(campDetailsStore.data?.name),
  };
});

onMounted(async () => {
  await campDetailsStore.fetchData();
});

const loading = computed<boolean>(() => {
  return campDetailsStore.isLoading;
});

const error = computed(() => {
  return campDetailsStore.error;
});

async function submit(campId: string, data: unknown) {
  await registrationStore.storeData(campId, data);
}

async function uploadFile(file: File) {
  const campId = campDetailsStore.data?.id;
  if (!campId) {
    throw 'Camp currently not present';
  }

  const serviceFile = await registrationStore.storeFile(campId, file);

  return serviceFile.id;
}

function updateBgColor(color: string | undefined) {
  bgColor.value = color;
}
</script>
