<template>
  <page-state-handler
    :loading
    :error
    class="row justify-center"
    :style="{ backgroundColor: bgColor }"
  >
    <registration-form
      v-if="camp"
      :camp-details="camp"
      :submit-fn="submit"
      :upload-file-fn="uploadFile"
      class="col-xs-12 col-sm-12 col-md-8 col-lg-6 col-xl-6"
      @bg-color-update="(color) => updateBgColor(color)"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { onBeforeMount, ref } from 'vue';
import { useMeta } from 'quasar';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import RegistrationForm from 'components/common/RegistrationForm.vue';
import type { CampDetails } from '@camp-registration/common/entities';
import { isAPIServiceError, useAPIService } from 'src/services/APIService';
import { useRoute } from 'vue-router';
import { v7 as uuid } from 'uuid';

const { to } = useObjectTranslation();
const api = useAPIService();
const route = useRoute();

const bgColor = ref<string>();
const camp = ref<CampDetails | undefined>();
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

onBeforeMount(async () => {
  await init();
});

useMeta(() => {
  return {
    title: to(camp.value?.name),
  };
});

async function init() {
  try {
    loading.value = true;

    const id = route.params.camp;
    if (typeof id !== 'string') {
      error.value = 'Invalid route params. Missing camp id.';
      return;
    }

    camp.value = await api.fetchCamp(id);
  } catch (err) {
    camp.value = undefined;

    const apiError = isAPIServiceError(err) ? err : null;
    if (apiError == null) {
      error.value = 'Unknown error';
      return;
    }

    switch (apiError.response?.status) {
      case 401:
      case 403:
        // TODO
        break;
      case 404:
        // TODO
        break;
      default:
        error.value = apiError.message;
    }
  } finally {
    loading.value = false;
  }
}

async function submit(campId: string, formData: Record<string, unknown>) {
  await api.createRegistration(campId, { data: formData });
}

async function uploadFile(file: File): Promise<string> {
  const serviceFile = await api.createTemporaryFile({
    file,
    field: uuid(),
  });

  if (serviceFile.field) {
    return `${serviceFile.id}#${serviceFile.field}`;
  }

  return serviceFile.id;
}

function updateBgColor(color: string | undefined) {
  bgColor.value = color;
}
</script>
