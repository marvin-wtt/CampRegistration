<template>
  <page-state-handler :error="error">
    <q-table
      v-model:selected="selected"
      v-model:pagination="pagination"
      :loading="isLoading"
      :title="t('title')"
      class="absolute fit"
      flat
      :columns="columns"
      :rows="rows"
      selection="multiple"
      virtual-scroll
      :rows-per-page-options="[0]"
    >
      <template #top-right>
        <div class="q-gutter-sm">
          <template v-if="selected.length === 0">
            <q-btn
              :label="t('action.upload')"
              icon="cloud_upload"
              color="primary"
              rounded
              :loading="uploadOngoing"
              @click="uploadFile"
            />
          </template>
          <template v-else>
            <q-btn
              :label="t('action.download')"
              icon="cloud_download"
              color="primary"
              rounded
              :disable="deletionOngoing"
              @click="downloadFiles"
            />
            <q-btn
              :label="t('action.delete')"
              icon="delete"
              color="negative"
              rounded
              :loading="deletionOngoing"
              @click="deleteFiles"
            />
          </template>
        </div>
      </template>
      <!-- Custom cells -->
      <template #body-cell-name="props">
        <q-td :props="props">
          <a
            :href="props.row.href"
            target="_blank"
            style="text-decoration: none; color: inherit"
          >
            {{ props.value }}
          </a>
        </q-td>
      </template>
    </q-table>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useI18n } from 'vue-i18n';
import { QTableColumn } from 'src/types/quasar/QTableColum';
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import FileUploadDialog from 'components/campManagement/settings/files/FileUploadDialog.vue';
import { ServiceFile } from 'src/types/ServiceFile';
import { formatBytes } from 'src/utils/formatters/formatBytes';
import { formatUtcDateTime } from 'src/utils/formatters/formatUtcDateTime';
import { useCampFilesStore } from 'stores/camp-files-store';

const { t } = useI18n();
const quasar = useQuasar();
const campStore = useCampDetailsStore();
const campFileStore = useCampFilesStore();

onMounted(async () => {
  await campStore.fetchData();
  await campFileStore.fetchData();
});

const uploadOngoing = ref(false);
const deletionOngoing = ref(false);
const selected = ref([]);
const pagination = ref({
  rowsPerPage: 0,
});
const columns: QTableColumn[] = [
  {
    name: 'name',
    label: t('column.name'),
    field: 'name',
    align: 'left',
  },
  {
    name: 'field',
    label: t('column.field'),
    field: 'field',
    align: 'left',
  },
  {
    name: 'access',
    label: t('column.access_level'),
    field: 'accessLevel',
    align: 'left',
  },
  {
    name: 'last_modified',
    label: t('column.last_modified'),
    field: 'createdAt',
    align: 'left',
  },
  {
    name: 'type',
    label: t('column.type'),
    field: 'type',
    align: 'left',
  },
  {
    name: 'size',
    label: t('column.size'),
    field: 'size',
    align: 'left',
  },
];
const rows = computed(() => {
  const files = campFileStore.data;
  if (!files) {
    return [];
  }

  return files.map((file) => mapColumnData(file));
});

const isLoading = computed<boolean>(() => {
  return campStore.isLoading || campFileStore.isLoading;
});

const error = computed<string | null>(() => {
  return campStore.error || campFileStore.error;
});

function mapColumnData(file: ServiceFile) {
  return {
    ...file,
    size: formatBytes(file.size),
    accessLevel: t(`access_level.${file.accessLevel}`, file.accessLevel),
    createdAt: formatUtcDateTime(file.createdAt),
    href: campFileStore.getUrl(file.id),
  };
}

function uploadFile() {
  quasar
    .dialog({
      component: FileUploadDialog,
    })
    .onOk(async (payload) => {
      uploadOngoing.value = true;
      try {
        await campFileStore.createEntry(payload);
      } catch (ignored) {
      } finally {
        uploadOngoing.value = false;
      }
    });
}

function deleteFiles() {
  selected.value.forEach((value: ServiceFile) => {
    campFileStore.deleteEntry(value.id);
  });
}

function downloadFiles() {
  selected.value.forEach((value: ServiceFile) => {
    campFileStore.downloadData(value.id);
  });
}
</script>

<i18n lang="yaml" locale="en">
title: 'Files'

action:
  delete: 'Delete'
  download: 'Download'
  upload: 'Upload'

column:
  access_level: 'Access'
  field: 'Group'
  last_modified: 'Last Modified'
  name: 'Name'
  size: 'Size'
  type: 'Type'

access_level:
  public: 'Public'
  private: 'Private'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Dateien'

action:
  delete: 'Löschen'
  download: 'Herunterladen'
  upload: 'Hochladen'

column:
  access_level: 'Zugriff'
  field: 'Gruppe'
  last_modified: 'Zuletzt geändert'
  name: 'Name'
  size: 'Größe'
  type: 'Typ'

access_level:
  public: 'Öffentlich'
  private: 'Privat'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Fichiers'

action:
  delete: 'Supprimer'
  download: 'Télécharger'
  upload: 'Téléverser'

column:
  access_level: "Niveau d'accès"
  field: 'Groupe'
  last_modified: 'Dernière modification'
  name: 'Nom'
  size: 'Taille'
  type: 'Type'

access_level:
  public: 'Public'
  private: 'Private'
</i18n>
