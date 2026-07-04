<template>
  <!-- File present: familiar open button; edit actions live in a small menu. -->
  <div
    v-if="fileId"
    class="row items-center no-wrap"
  >
    <file-table-cell
      :props="cellProps"
      :camp="camp"
      :printing="printing"
      :grid-mode="gridMode"
    />

    <q-btn
      v-if="editable"
      :size
      :loading
      dense
      flat
      round
      icon="more_vert"
    >
      <q-menu auto-close>
        <q-list dense>
          <q-item
            clickable
            @click="pickFile"
          >
            <q-item-section side>
              <q-icon name="upload" />
            </q-item-section>
            <q-item-section>{{ t('action.replace') }}</q-item-section>
          </q-item>
          <q-item
            clickable
            @click="remove"
          >
            <q-item-section side>
              <q-icon name="delete" />
            </q-item-section>
            <q-item-section>{{ t('action.remove') }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>

  <!-- Empty and editable: a single upload button. -->
  <q-btn
    v-else-if="editable"
    :size
    :loading
    class="q-mx-sm q-px-sm"
    dense
    icon="upload"
    outline
    stretch
    @click="pickFile"
  >
    <q-tooltip>{{ t('action.upload') }}</q-tooltip>
  </q-btn>

  <!-- Hidden picker; opened programmatically via pickFiles() -->
  <q-file
    v-if="editable"
    ref="filePicker"
    v-model="pickedFile"
    class="hidden"
    @update:model-value="onFilePicked"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { QFile, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import FileTableCell from 'components/campManagement/table/tableCells/FileTableCell.vue';
import { useAPIService } from 'src/services/APIService';
import { useRegistrationsStore } from 'stores/registration-store';
import { usePermissions } from 'src/composables/permissions';

const {
  props: cellProps,
  camp,
  printing,
  gridMode = false,
} = defineProps<TableCellProps>();

const api = useAPIService();
const quasar = useQuasar();
const { t } = useI18n();
const { can } = usePermissions();
const registrationsStore = useRegistrationsStore();

const filePicker = ref<QFile>();
const pickedFile = ref<File | null>(null);
const loading = ref<boolean>(false);

// The cell value is the file id from the registration's `customFiles.<slot>`
// record.
const fileId = computed<string | null>(() => {
  return typeof cellProps.value === 'string' && cellProps.value.length > 0
    ? cellProps.value
    : null;
});

const slotName = computed<string | undefined>(() => {
  const fieldName = getStringValue(cellProps.col, 'fieldName');

  return fieldName?.startsWith('customFiles.')
    ? fieldName.substring('customFiles.'.length)
    : fieldName;
});

const registrationId = computed<string | undefined>(() =>
  getStringValue(cellProps.row, 'id'),
);

const editable = computed<boolean>(() => {
  if (printing || !registrationId.value || !slotName.value) {
    return false;
  }

  return can('camp.registrations.edit');
});

const size = computed<string>(() => {
  return cellProps.dense ? 'xs' : 'md';
});

function pickFile() {
  filePicker.value?.pickFiles();
}

function onFilePicked(file: File | null) {
  if (!file) {
    return;
  }

  loading.value = true;

  api
    .createTemporaryFile({ file })
    .then((serviceFile) => save(serviceFile.id))
    .catch((error: unknown) => {
      // eslint-disable-next-line no-console
      console.error('File upload failed', error);

      quasar.notify({
        type: 'negative',
        message: t('error.upload_failed'),
        caption: file.name,
      });
    })
    .finally(() => {
      loading.value = false;
      pickedFile.value = null;
    });
}

function remove() {
  loading.value = true;

  void save(null).finally(() => {
    loading.value = false;
  });
}

async function save(fileId: string | null): Promise<void> {
  if (!registrationId.value || !slotName.value) {
    return;
  }

  // Per-slot update; the backend detaches the replaced / removed file.
  await registrationsStore.updateData(registrationId.value, {
    customFiles: { [slotName.value]: fileId },
  });
}

function getStringValue(obj: object, key: string): string | undefined {
  const data = obj as Record<string, unknown>;

  if (data[key] != null && key in data && typeof data[key] === 'string') {
    return data[key];
  }

  return undefined;
}
</script>

<i18n lang="yaml" locale="en">
action:
  upload: 'Upload file'
  replace: 'Replace file'
  remove: 'Remove file'

error:
  upload_failed: 'File upload failed'
</i18n>

<i18n lang="yaml" locale="de">
action:
  upload: 'Datei hochladen'
  replace: 'Datei ersetzen'
  remove: 'Datei entfernen'

error:
  upload_failed: 'Datei-Upload fehlgeschlagen'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  upload: 'Télécharger le fichier'
  replace: 'Remplacer le fichier'
  remove: 'Supprimer le fichier'

error:
  upload_failed: 'Échec du téléchargement du fichier'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  upload: 'Prześlij plik'
  replace: 'Zastąp plik'
  remove: 'Usuń plik'

error:
  upload_failed: 'Przesyłanie pliku nie powiodło się'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  upload: 'Nahrát soubor'
  replace: 'Nahradit soubor'
  remove: 'Odebrat soubor'

error:
  upload_failed: 'Nahrávání souboru se nezdařilo'
</i18n>
