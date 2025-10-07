<template>
  <page-state-handler :error>
    <q-table
      v-model:selected="selected"
      v-model:pagination="pagination"
      :loading
      :title="t('title')"
      class="absolute fit"
      flat
      :columns
      :rows
      selection="multiple"
      virtual-scroll
      :rows-per-page-options="[0]"
    >
      <template #top-right>
        <div class="q-gutter-sm">
          <template v-if="selected.length === 0">
            <q-btn
              v-if="can('camp.files.create')"
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
              v-if="can('camp.files.delete')"
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
      <!-- Link button -->
      <template #body-cell-link="props">
        <q-td :props="props">
          <q-btn
            icon="share"
            size="sm"
            rounded
            dense
            @click="copyLink(props.value)"
          />
        </q-td>
      </template>
    </q-table>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useI18n } from 'vue-i18n';
import { type QTableColumn } from 'quasar';
import { computed, ref } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';
import FileUploadDialog from 'components/campManagement/settings/files/FileUploadDialog.vue';
import type { ServiceFile } from '@camp-registration/common/entities';
import { formatBytes } from 'src/utils/formatters/formatBytes';
import { formatUtcDateTime } from 'src/utils/formatters/formatUtcDateTime';
import { useCampFilesStore } from 'stores/camp-files-store';
import { usePermissions } from 'src/composables/permissions';

const { t } = useI18n();
const quasar = useQuasar();
const campStore = useCampDetailsStore();
const campFileStore = useCampFilesStore();
const { can } = usePermissions();

campStore.fetchData();
campFileStore.fetchData();

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
    name: 'link',
    label: t('column.link'),
    field: 'href',
    align: 'center',
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

const loading = computed<boolean>(() => {
  return campStore.isLoading || campFileStore.isLoading;
});

const error = computed<string | null>(() => {
  return campStore.error || campFileStore.error;
});

function mapColumnData(file: ServiceFile) {
  const accessLevel = file.accessLevel
    ? t(`access_level.${file.accessLevel}`)
    : 'Unknown';
  return {
    ...file,
    size: formatBytes(file.size),
    accessLevel,
    createdAt: formatUtcDateTime(file.createdAt),
    href: campFileStore.getUrl(file.id),
  };
}

function uploadFile() {
  uploadOngoing.value = true;

  quasar
    .dialog({
      component: FileUploadDialog,
    })
    .onDismiss(() => {
      uploadOngoing.value = false;
    });
}

function deleteFiles() {
  selected.value.forEach((value: ServiceFile) => {
    campFileStore.deleteEntry(value.id);
  });

  selected.value = [];
}

function downloadFiles() {
  selected.value.forEach((file) => campFileStore.downloadFile(file));
}

function copyLink(url: string) {
  copyToClipboard(url)
    .then(() => {
      quasar.notify({
        type: 'positive',
        message: t('notification.copy_link.success'),
      });
    })
    .catch((reason) => {
      quasar.notify({
        type: 'negative',
        message: t('notification.copy_link.failed'),
        caption: reason,
      });
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
  field: 'Identifier'
  last_modified: 'Last Modified'
  link: 'Link'
  name: 'Name'
  size: 'Size'
  type: 'Type'

access_level:
  public: 'Public'
  private: 'Private'

notification:
  copy_link:
    success: 'Link copied to clipboard'
    failed: 'Failed to copy link to clipboard'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Dateien'

action:
  delete: 'Löschen'
  download: 'Herunterladen'
  upload: 'Hochladen'

column:
  access_level: 'Zugriff'
  field: 'Kennung'
  last_modified: 'Zuletzt geändert'
  link: 'Link'
  name: 'Name'
  size: 'Größe'
  type: 'Typ'

access_level:
  public: 'Öffentlich'
  private: 'Privat'

notification:
  copy_link:
    success: 'Link in Zwischenablage kopiert'
    failed: 'Link konnte nicht in Zwischenablage kopiert werden'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Fichiers'

action:
  delete: 'Supprimer'
  download: 'Télécharger'
  upload: 'Téléverser'

column:
  access_level: 'Accès'
  field: 'Identifiant'
  last_modified: 'Dernière modification'
  link: 'Lien'
  name: 'Nom'
  size: 'Taille'
  type: 'Type'

access_level:
  public: 'Public'
  private: 'Privé'

notification:
  copy_link:
    success: 'Lien copié dans le presse-papiers'
    failed: 'Échec de la copie du lien dans le presse-papiers'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Pliki'

action:
  delete: 'Usuń'
  download: 'Pobierz'
  upload: 'Prześlij'

column:
  access_level: 'Dostęp'
  field: 'Identyfikator'
  last_modified: 'Ostatnia modyfikacja'
  link: 'Link'
  name: 'Nazwa'
  size: 'Rozmiar'
  type: 'Typ'

access_level:
  public: 'Publiczny'
  private: 'Prywatny'

notification:
  copy_link:
    success: 'Link skopiowany do schowka'
    failed: 'Nie udało się skopiować linku do schowka'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Soubory'

action:
  delete: 'Smazat'
  download: 'Stáhnout'
  upload: 'Nahrát'

column:
  access_level: 'Přístup'
  field: 'Identifikátor'
  last_modified: 'Naposledy změněno'
  link: 'Odkaz'
  name: 'Název'
  size: 'Velikost'
  type: 'Typ'

access_level:
  public: 'Veřejný'
  private: 'Soukromý'

notification:
  copy_link:
    success: 'Odkaz zkopírován do schránky'
    failed: 'Nepodařilo se zkopírovat odkaz do schránky'
</i18n>
