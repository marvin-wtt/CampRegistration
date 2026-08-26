<template>
  <page-state-handler
    :error="error"
    :loading="loading"
  >
    <form-editor
      v-if="showEditor && eventData && eventFiles"
      :event="eventData"
      :files="eventFiles"
      :restricted-access="restrictedAccess"
      :save-form-func="saveForm"
      :save-theme-func="saveTheme"
      :save-file-func="saveFile"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { computed, onMounted, ref } from 'vue';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useEventFilesStore } from '@/stores/event-files-store';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useRegistrationsStore } from '@/stores/registration-store';
import FormEditor from '@/components/event/settings/form/FormEditor.vue';
import type { SurveyJSEventData } from '@camp-registration/common/entities';
import type { ITheme } from 'survey-core';
import EditorRestrictedAccessDialog from '@/components/event/settings/form/EditorRestrictedAccessDialog.vue';
import { toRelativeUrl } from '@/utils/url';
import { createUuid } from '@/utils/uuid';

const quasar = useQuasar();
const eventDetailsStore = useEventDetailsStore();
const eventFileStore = useEventFilesStore();
const registrationStore = useRegistrationsStore();
const { data: eventData } = storeToRefs(eventDetailsStore);
const { data: eventFiles } = storeToRefs(eventFileStore);

const showEditor = ref<boolean>(false);
const restrictedAccess = ref<boolean>(false);

const loading = computed<boolean>(() => {
  return (
    eventDetailsStore.isLoading ||
    eventFileStore.isLoading ||
    registrationStore.isLoading
  );
});

const error = computed(() => {
  return (
    eventDetailsStore.error || eventFileStore.error || registrationStore.error
  );
});

onMounted(async () => {
  await Promise.allSettled([
    eventDetailsStore.fetchData(),
    eventFileStore.fetchData(),
    registrationStore.fetchData(),
  ]);

  if (!eventDetailsStore.data) {
    return;
  }

  if (registrationStore.data && registrationStore.data.length > 0) {
    quasar
      .dialog({
        component: EditorRestrictedAccessDialog,
        persistent: true,
      })
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
});

async function saveForm(form: SurveyJSEventData): Promise<void> {
  const data = {
    form,
  };

  await eventDetailsStore.updateData(data, 'none');
}

async function saveTheme(theme: ITheme): Promise<void> {
  const colorPlatte = theme.colorPalette ?? 'light';

  const data = {
    themes: {
      ...eventDetailsStore.data?.themes,
      [colorPlatte]: theme,
    },
  };

  await eventDetailsStore.updateData(data, 'none');
}

async function saveFile(file: File): Promise<string> {
  const eventId = eventData.value?.id;

  if (!eventId) {
    throw new Error('Event not defined');
  }

  // When file is selected via custom picker, then the file is already present on the server
  if ('id' in file && typeof file.id === 'string') {
    return toRelativeUrl(eventFileStore.getUrl(file.id));
  }

  const newFile = await eventFileStore.createEntry({
    name: file.name.replace(/\.[^/.]+$/, ''),
    field: createUuid(),
    file,
    accessLevel: 'public',
  });

  return eventFileStore.getUrl(newFile.id);
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
