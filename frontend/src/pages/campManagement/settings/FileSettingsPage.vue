<template>
  <page-state-handler :error>
    <q-table
      v-model:selected="selected"
      v-model:pagination="pagination"
      :loading
      :title="t('title')"
      class="absolute fit"
      card-class="bg-default"
      flat
      :columns
      :rows
      row-key="id"
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
              v-if="selected.length === 1 && can('camp.files.create')"
              :label="t('action.replace')"
              icon="cloud_upload"
              color="primary"
              rounded
              :disable="deletionOngoing"
              @click="openReplaceDialog(selected[0]!)"
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

      <!-- Selection: hide checkbox for virtual rows -->
      <template #body-selection="props">
        <q-td v-if="!props.row._virtual">
          <q-checkbox
            v-model="props.selected"
            dense
          />
        </q-td>
        <q-td v-else />
      </template>

      <!-- Name: upload action for virtual rows, file link for real rows -->
      <template #body-cell-name="props">
        <q-td :props="props">
          <q-btn
            v-if="props.row._virtual"
            :label="getUploadHint(props.row.field, props.row.locale)"
            icon="cloud_upload"
            color="warning"
            no-caps
            rounded
            flat
            dense
            class="q-px-xs"
            @click="uploadForSlot(props.row.field, props.row.locale)"
          />
          <a
            v-else
            :href="props.row.href"
            target="_blank"
            style="text-decoration: none; color: inherit"
          >
            {{ props.value }}
          </a>
        </q-td>
      </template>

      <!-- Link: hidden for virtual rows -->
      <template #body-cell-link="props">
        <q-td :props="props">
          <q-btn
            v-if="!props.row._virtual"
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
import { computed, onMounted, ref, watch } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';
import FileUploadDialog from 'components/campManagement/settings/files/FileUploadDialog.vue';
import type { ServiceFile } from '@camp-registration/common/entities';
import { formatBytes } from 'src/utils/formatters/formatBytes';
import { formatUtcDateTime } from 'src/utils/formatters/formatUtcDateTime';
import { useCampFilesStore } from 'stores/camp-files-store';
import { usePermissions } from 'src/composables/permissions';

const i18n = useI18n();
const { t } = i18n;
const quasar = useQuasar();
const campStore = useCampDetailsStore();
const campFileStore = useCampFilesStore();
const { can } = usePermissions();

onMounted(async () => {
  await Promise.allSettled([campStore.fetchData(), campFileStore.fetchData()]);
});

const uploadOngoing = ref(false);
const deletionOngoing = ref(false);
const selected = ref([]);
const pagination = ref({ rowsPerPage: 0 });

watch(selected, (val) => {
  const filtered = val.filter((row: { _virtual?: boolean }) => !row._virtual);

  if (filtered.length !== val.length) {
    selected.value = filtered;
  }
});

const columns: QTableColumn[] = [
  { name: 'name', label: t('column.name'), field: 'name', align: 'left' },
  { name: 'link', label: t('column.link'), field: 'href', align: 'center' },
  { name: 'field', label: t('column.field'), field: 'field', align: 'left' },
  { name: 'locale', label: t('column.locale'), field: 'locale', align: 'left' },
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
  { name: 'type', label: t('column.type'), field: 'type', align: 'left' },
  { name: 'size', label: t('column.size'), field: 'size', align: 'left' },
];

const rows = computed(() => {
  const fileRows = (campFileStore.data ?? []).map(mapFileRow);

  if (!can('camp.files.create')) {
    return fileRows;
  }

  const pendingRows = campFileStore.pendingSlots.map((slot) => ({
    _virtual: true as const,
    id: `__pending__${slot}`,
    field: slot,
    locale: null,
    name: '',
    href: '',
    type: '',
    size: '',
    accessLevel: '',
    createdAt: '',
  }));

  const missingLocaleRows = campFileStore.slotsWithMissingLocales.flatMap(
    ({ slot, missingLocales }) =>
      missingLocales.map((locale) => ({
        _virtual: true as const,
        id: `__missing__${slot}__${locale}`,
        field: slot,
        locale,
        name: '',
        href: '',
        type: '',
        size: '',
        accessLevel: '',
        createdAt: '',
      })),
  );

  return [...fileRows, ...pendingRows, ...missingLocaleRows];
});

const loading = computed<boolean>(
  () => campStore.isLoading || campFileStore.isLoading,
);

const error = computed<string | null>(
  () => campStore.error || campFileStore.error,
);

function mapFileRow(file: ServiceFile) {
  return {
    ...file,
    _virtual: false as const,
    size: formatBytes(file.size),
    accessLevel: file.accessLevel ? t(`access_level.${file.accessLevel}`) : '',
    createdAt: formatUtcDateTime(file.createdAt),
    href: campFileStore.getUrl(file.id),
  };
}

function openDialog(componentProps?: Record<string, unknown>) {
  uploadOngoing.value = true;
  quasar
    .dialog({ component: FileUploadDialog, componentProps })
    .onDismiss(() => {
      uploadOngoing.value = false;
    });
}

function uploadFile() {
  openDialog();
}

function getUploadHint(field: string, locale?: string | null): string {
  const key = `virtual.upload_hint.${field}`;
  const label = i18n.te(key)
    ? t(key)
    : t('virtual.upload_hint.default', { field });

  return locale ? `${label} (${locale})` : label;
}

function uploadForSlot(slot: string, locale?: string | null) {
  openDialog({ initialField: slot, initialLocale: locale });
}

function openReplaceDialog(file: ServiceFile) {
  openDialog({ fileToReplace: file });
}

function deleteFiles() {
  selected.value
    .filter((row: { _virtual: boolean }) => !row._virtual)
    .forEach((value: ServiceFile) => {
      void campFileStore.deleteEntry(value.id);
    });
  selected.value = [];
}

function downloadFiles() {
  selected.value
    .filter((row: { _virtual: boolean }) => !row._virtual)
    .forEach((file) => void campFileStore.downloadFile(file));
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
  replace: 'Replace'

virtual:
  upload_hint:
    rules: 'Upload Camp Rules'
    toc: 'Upload Terms & Conditions'
    default: 'Upload {field}'

column:
  access_level: 'Access'
  field: 'Identifier'
  last_modified: 'Last Modified'
  link: 'Link'
  locale: 'Language'
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
  replace: 'Ersetzen'

virtual:
  upload_hint:
    rules: 'Campregeln hochladen'
    toc: 'AGB hochladen'
    default: '{field} hochladen'

column:
  access_level: 'Zugriff'
  field: 'Kennung'
  last_modified: 'Zuletzt geändert'
  link: 'Link'
  locale: 'Sprache'
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
  replace: 'Remplacer'

virtual:
  upload_hint:
    rules: 'Téléverser le règlement'
    toc: 'Téléverser les conditions générales'
    default: 'Téléverser {field}'

column:
  access_level: 'Accès'
  field: 'Identifiant'
  last_modified: 'Dernière modification'
  link: 'Lien'
  locale: 'Langue'
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
  replace: 'Zastąp'

virtual:
  upload_hint:
    rules: 'Prześlij regulamin'
    toc: 'Prześlij warunki uczestnictwa'
    default: 'Prześlij {field}'

column:
  access_level: 'Dostęp'
  field: 'Identyfikator'
  last_modified: 'Ostatnia modyfikacja'
  link: 'Link'
  locale: 'Język'
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
  replace: 'Nahradit'

virtual:
  upload_hint:
    rules: 'Nahrát táborová pravidla'
    toc: 'Nahrát obchodní podmínky'
    default: 'Nahrát {field}'

column:
  access_level: 'Přístup'
  field: 'Identifikátor'
  last_modified: 'Naposledy změněno'
  link: 'Odkaz'
  locale: 'Jazyk'
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
