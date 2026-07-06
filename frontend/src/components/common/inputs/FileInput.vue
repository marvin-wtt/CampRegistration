<template>
  <q-file
    :model-value="files"
    multiple
    append
    v-bind="attrs"
    @update:model-value="updateFiles"
  >
    <template #file="{ index, file }">
      <q-chip
        removable
        :icon="model?.at(index)?.id ? 'done' : 'cloud_upload'"
        @remove="removeFile(index)"
      >
        <div class="ellipsis relative-position">
          {{ file.name }}
        </div>

        <q-tooltip>
          {{ file.name }}
        </q-tooltip>
      </q-chip>
    </template>

    <template
      v-for="(data, name, index) in slots"
      :key="index"
      #[name]
    >
      <slot
        :name
        v-bind="data"
      />
    </template>
  </q-file>
</template>

<script lang="ts" setup>
import { ref, useAttrs, watch } from 'vue';
import type { QInputSlots } from 'quasar';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAPIService } from '@/services/APIService';
import type { ServiceFile } from '@camp-registration/common/entities';

const api = useAPIService();
const quasar = useQuasar();
const { t } = useI18n();

const attrs = useAttrs();
const slots = defineSlots<QInputSlots>();

export type FileInputModel =
  | ServiceFile
  | {
      id?: undefined;
      name: string;
      progressId: string;
    };

const model = defineModel<FileInputModel[] | null | undefined>();

const files = ref<File[]>([]);

watch(model, initFiles);

initFiles();
function initFiles() {
  files.value = model.value ? model.value.map((v) => new File([], v.name)) : [];
}

function updateFiles(updatedFiles: File[]) {
  const added = updatedFiles.length - (model.value?.length ?? 0);
  if (added === 0) {
    // Since replace is not possible, this can be ignored
    return;
  }

  if (added < 0) {
    throw Error('File got removed without calling removeFile');
  }

  if (!model.value) {
    model.value = [];
  }
  if (!files.value) {
    files.value = [];
  }

  // Do nothing when the model does not update due to missing reactivity
  if (!model.value || !files.value) {
    // eslint-disable-next-line no-console
    console.error('Model or files not initialized');
    return;
  }

  files.value = updatedFiles;

  model.value.push(
    ...updatedFiles.slice(model.value.length).map((file) => {
      const progressId = crypto.randomUUID();

      api
        .createTemporaryFile({ file })
        .then((serviceFile) => onUploadSuccess(progressId, serviceFile))
        .catch((e) => onUploadError(progressId, e));

      return {
        id: undefined,
        name: file.name,
        progressId,
      };
    }),
  );
}

function removeFile(index: number) {
  model.value?.splice(index, 1);
  files.value.splice(index, 1);
}

function onUploadSuccess(progressId: string, serviceFile: ServiceFile) {
  const i = findIndexByProgressId(progressId);
  if (i < 0) {
    return;
  }

  model.value?.splice(i, 1, serviceFile);
}

function onUploadError(progressId: string, error: unknown) {
  // eslint-disable-next-line no-console
  console.error('File upload failed', error);

  const i = findIndexByProgressId(progressId);
  if (i < 0) {
    return;
  }

  const failedName = model.value?.at(i)?.name ?? '';
  removeFile(i);

  quasar.notify({
    type: 'negative',
    message: t('uploadFailed'),
    caption: failedName,
  });
}

function findIndexByProgressId(progressId: string): number {
  return (
    model.value?.findIndex(
      (m) => m.id === undefined && m.progressId === progressId,
    ) ?? -1
  );
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
uploadFailed: 'File upload failed'
</i18n>

<i18n lang="yaml" locale="de">
uploadFailed: 'Datei-Upload fehlgeschlagen'
</i18n>

<i18n lang="yaml" locale="fr">
uploadFailed: 'Échec du téléchargement du fichier'
</i18n>

<i18n lang="yaml" locale="pl">
uploadFailed: 'Przesyłanie pliku nie powiodło się'
</i18n>

<i18n lang="yaml" locale="cs">
uploadFailed: 'Nahrávání souboru se nezdařilo'
</i18n>
