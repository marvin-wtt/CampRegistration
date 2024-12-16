<template>
  <page-state-handler
    :error="error"
    :loading="loading"
  >
    <form-editor
      v-if="showEditor && campData && campFiles"
      :camp="campData"
      :files="campFiles"
      :restricted-access="restrictedAccess"
      :save-form-func="saveForm"
      :save-theme-func="saveTheme"
      :save-file-func="saveFile"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { computed, ref } from 'vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useCampFilesStore } from 'stores/camp-files-store';
import { storeToRefs } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { useQuasar } from 'quasar';
import { useRegistrationsStore } from 'stores/registration-store.ts';
import FormEditor from 'components/campManagement/settings/form/FormEditor.vue';
import type { SurveyJSCampData } from '@camp-registration/common/entities';
import { ITheme } from 'survey-core';
import EditorRestrictedAccessDialog from 'components/campManagement/settings/form/EditorRestrictedAccessDialog.vue';

const quasar = useQuasar();
const api = useAPIService();
const campDetailsStore = useCampDetailsStore();
const campFileStore = useCampFilesStore();
const registrationStore = useRegistrationsStore();
const { data: campData } = storeToRefs(campDetailsStore);
const { data: campFiles } = storeToRefs(campFileStore);

const showEditor = ref<boolean>(false);
let restrictedAccess = ref<boolean>(false);

const loading = computed<boolean>(() => {
  return (
    campDetailsStore.isLoading ||
    campFileStore.isLoading ||
    registrationStore.isLoading
  );
});

const error = computed(() => {
  return (
    campDetailsStore.error || campFileStore.error || registrationStore.error
  );
});

async function init() {
  await campDetailsStore.fetchData();
  await campFileStore.fetchData();
  await registrationStore.fetchData();

  if (!campDetailsStore.data) {
    return;
  }

  if (registrationStore.data && registrationStore.data.length > 0) {
    quasar
      .dialog({ component: EditorRestrictedAccessDialog })
      .onOk(() => {
        restrictedAccess.value = true;
      })
      .onCancel(() => {
        restrictedAccess.value = false;
      })
      .onDismiss(() => {
        showEditor.value = true;
      });
  } else {
    showEditor.value = true;
  }
}
init();

async function saveForm(form: SurveyJSCampData): Promise<void> {
  const data = {
    form,
  };

  await campDetailsStore.updateData(data, 'none');
}

async function saveTheme(theme: ITheme): Promise<void> {
  const colorPlatte = theme.colorPalette ?? 'light';

  const data = {
    themes: {
      ...campDetailsStore.data?.themes,
      [colorPlatte]: theme,
    },
  };

  await campDetailsStore.updateData(data, 'none');
}

async function saveFile(file: File): Promise<string> {
  const campId = campData.value?.id;

  if (!campId) {
    throw 'Camp not loaded';
  }

  // When file is selected via custom picker, then the file is already present on the server
  if ('id' in file && typeof file.id === 'string') {
    return campFileStore.getUrl(file.id, campId);
  }

  const newFile = await campFileStore.createEntry({
    name: file.name.replace(/\.[^/.]+$/, ''),
    field: crypto.randomUUID(),
    file,
    accessLevel: 'public',
  });

  return campFileStore.getUrl(newFile.id, campId);
}
</script>

<style>
.svc-creator {
  position: absolute;
}

/* Creator popups should be over navigation bar */
.sv-popup {
  z-index: 5000;
}
</style>
