<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-form
        @submit="onOKClick"
        @reset="onCancelClick"
      >
        <q-card-section class="text-h6">
          {{ t('title') }}
        </q-card-section>
        <q-card-section>
          <q-list
            v-if="isLoading"
            separator
          >
            <q-item
              v-for="i in 3"
              :key="i"
            >
              <q-item-section avatar>
                <q-skeleton type="QCheckbox" />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  <q-skeleton type="text" />
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <q-list
            v-else
            separator
          >
            <q-item
              v-for="file in files"
              :key="file.id"
              v-ripple
              clickable
              @click="toggleFileSelect(file)"
            >
              <q-item-section
                avatar
                top
              >
                <q-checkbox
                  v-if="multiple"
                  :model-value="selected.includes(file)"
                  :val="file.name"
                />
                <q-radio
                  v-else
                  :model-value="selected[0]"
                  :val="file"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ to(file.name) }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              v-ripple
              clickable
              @click="upload()"
            >
              <q-item-section avatar>
                <q-icon
                  size="sm"
                  name="cloud_upload"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ t('action.upload') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            :label="t('action.cancel')"
            type="reset"
            outline
            rounded
            color="primary"
          />
          <q-btn
            :label="t('action.ok')"
            :loading="isLoading"
            :disable="selected.length === 0"
            type="submit"
            rounded
            color="primary"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useCampFilesStore } from 'stores/camp-files-store';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import type { ServiceFile } from '@camp-registration/common/entities';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import FileUploadDialog from 'components/campManagement/settings/files/FileUploadDialog.vue';

const quasar = useQuasar();
const campFileStore = useCampFilesStore();

const { t } = useI18n();
const { to } = useObjectTranslation();
const { data, isLoading } = storeToRefs(campFileStore);

campFileStore.fetchData();

defineEmits([...useDialogPluginComponent.emits]);

const { multiple, accept, accessLevel } = defineProps<{
  multiple?: boolean;
  accept?: string;
  accessLevel?: string;
}>();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const selected = ref<ServiceFile[]>([]);

// Parse the accept string into an array, separating by commas and trimming whitespace
const acceptedTypes = computed<string[]>(() => {
  if (!accept) {
    return [];
  }

  return accept
    .split(',')
    .map((type) => type.trim())
    .filter((value) => value.length > 0);
});

const files = computed<ServiceFile[]>(() => {
  return data.value?.filter(filterAccessLevel).filter(filterFileType) ?? [];
});

function onOKClick() {
  onDialogOK(selected.value);
}

function onCancelClick() {
  onDialogCancel();
}

function filterAccessLevel(file: ServiceFile): boolean {
  return !accessLevel || file.accessLevel === accessLevel;
}

function filterFileType(file: ServiceFile): boolean {
  if (acceptedTypes.value.length === 0) {
    return true;
  }

  // Filter the files array by checking each file against all accept types
  return acceptedTypes.value.some((acceptType) => {
    if (acceptType.startsWith('.')) {
      // If it's a file extension, check the file's name
      return file.name.toLowerCase().endsWith(acceptType.toLowerCase());
    }

    if (acceptType.endsWith('/*')) {
      // If it's a media type (e.g., image/*), check the file's MIME type prefix
      const baseMimeType = acceptType.split('/')[0]!;
      return file.type.startsWith(baseMimeType);
    }

    // Otherwise, it's a specific MIME type (e.g., image/jpeg)
    return file.type === acceptType;
  });
}

function toggleFileSelect(file: ServiceFile) {
  if (!multiple) {
    selected.value = [file];
    return;
  }

  const index = selected.value.indexOf(file);
  if (index === -1) {
    selected.value.push(file);
  } else {
    selected.value.splice(index, 1);
  }
}

function upload() {
  quasar
    .dialog({
      component: FileUploadDialog,
    })
    .onOk((file: ServiceFile) => {
      if (multiple) {
        selected.value.push(file);
      } else {
        selected.value = [file];
      }
    });
}
</script>

<i18n lang="yaml" locale="en">
title: 'Select File'

column:
  name: 'Name'

action:
  cancel: 'Cancel'
  upload: 'Upload'
  ok: 'Select'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Datei Auswählen'

column:
  name: 'Name'

action:
  cancel: 'Abbrechen'
  upload: 'Hochladen'
  ok: 'Auswählen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Sélectionner un fichier'

column:
  name: 'Nom'

action:
  ok: 'Sélectionner'
  cancel: 'Annuler'
  upload: 'Télécharger'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wybierz plik'

column:
  name: 'Nazwa'

action:
  cancel: 'Anuluj'
  upload: 'Prześlij'
  ok: 'Wybierz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vyberte soubor'

column:
  name: 'Název'

action:
  cancel: 'Zrušit'
  upload: 'Nahrát'
  ok: 'Vybrat'
</i18n>

<style scoped></style>
