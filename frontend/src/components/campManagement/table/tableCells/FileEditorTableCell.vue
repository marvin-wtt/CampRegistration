<template>
  <!-- File present + editable: familiar open button, plus a compact menu for
       replace/remove — a native split-button here fought with the MD3 theme's
       button-group styling and rendered with broken corners/spacing. -->
  <div
    v-if="fileId && editable"
    class="row items-center no-wrap"
  >
    <file-table-cell
      :props="cellProps"
      :camp="camp"
      :printing="printing"
      :grid-mode="gridMode"
    />

    <q-btn
      :size
      :loading
      :disable="loading"
      dense
      flat
      round
      icon="more_vert"
    >
      <q-tooltip>{{ t('action.more') }}</q-tooltip>

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
            class="text-negative"
            @click="confirmRemove"
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

  <!-- File present, read-only (printing / no edit permission): plain open
       button, unchanged from the generic file cell. -->
  <file-table-cell
    v-else-if="fileId"
    :props="cellProps"
    :camp="camp"
    :printing="printing"
    :grid-mode="gridMode"
  />

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
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { formatPersonName } from 'src/utils/formatters';

const {
  props: cellProps,
  camp,
  printing,
  gridMode = false,
} = defineProps<TableCellProps>();

const api = useAPIService();
const quasar = useQuasar();
const { t } = useI18n();
const { to } = useObjectTranslation();
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

const label = computed<string>(() => to(cellProps.col.label));

// Shown in the confirm dialogs so a busy table doesn't lead to mixing up rows.
const registrationName = computed<string>(() => {
  const fullName = [
    cellProps.row.computedData.firstName,
    cellProps.row.computedData.lastName,
  ]
    .filter((name) => !!name)
    .join(' ');

  return formatPersonName(fullName);
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
    .then((serviceFile) => {
      quasar
        .dialog({
          title: t('dialog.replace.title'),
          message: t('dialog.replace.message', {
            label: label.value,
            name: file.name,
            registration: registrationName.value,
          }),
          cancel: {
            label: t('dialog.replace.cancel'),
            color: 'primary',
            rounded: true,
            outline: true,
          },
          ok: {
            label: t('dialog.replace.ok'),
            color: 'primary',
            rounded: true,
          },
        })
        .onOk(() => {
          void save(serviceFile.id).finally(() => {
            loading.value = false;
          });
        })
        .onCancel(() => {
          // The uploaded temp file is left unowned and cleaned up by the
          // existing temp/unassigned file cleanup jobs.
          loading.value = false;
        });
    })
    .catch((error: unknown) => {
      // eslint-disable-next-line no-console
      console.error('File upload failed', error);

      quasar.notify({
        type: 'negative',
        message: t('error.upload_failed'),
        caption: file.name,
      });

      loading.value = false;
    })
    .finally(() => {
      pickedFile.value = null;
    });
}

function confirmRemove() {
  quasar
    .dialog({
      title: t('dialog.remove.title'),
      message: t('dialog.remove.message', {
        label: label.value,
        registration: registrationName.value,
      }),
      cancel: {
        label: t('dialog.remove.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('dialog.remove.ok'),
        color: 'negative',
        rounded: true,
      },
    })
    .onOk(() => {
      loading.value = true;

      void save(null).finally(() => {
        loading.value = false;
      });
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
  more: 'More actions'

error:
  upload_failed: 'File upload failed'

dialog:
  remove:
    title: 'Remove file'
    message: 'Remove "{label}" for {registration}? This cannot be undone.'
    cancel: 'Cancel'
    ok: 'Remove'
  replace:
    title: 'Replace file'
    message: 'Replace "{label}" for {registration} with "{name}"? The current file cannot be recovered.'
    cancel: 'Cancel'
    ok: 'Replace'
</i18n>

<i18n lang="yaml" locale="de">
action:
  upload: 'Datei hochladen'
  replace: 'Datei ersetzen'
  remove: 'Datei entfernen'
  more: 'Weitere Aktionen'

error:
  upload_failed: 'Datei-Upload fehlgeschlagen'

dialog:
  remove:
    title: 'Datei entfernen'
    message: '„{label}“ für {registration} entfernen? Dies kann nicht rückgängig gemacht werden.'
    cancel: 'Abbrechen'
    ok: 'Entfernen'
  replace:
    title: 'Datei ersetzen'
    message: '„{label}“ für {registration} durch „{name}“ ersetzen? Die aktuelle Datei kann nicht wiederhergestellt werden.'
    cancel: 'Abbrechen'
    ok: 'Ersetzen'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  upload: 'Télécharger le fichier'
  replace: 'Remplacer le fichier'
  remove: 'Supprimer le fichier'
  more: "Plus d'actions"

error:
  upload_failed: 'Échec du téléchargement du fichier'

dialog:
  remove:
    title: 'Supprimer le fichier'
    message: 'Supprimer « {label} » pour {registration} ? Cette action est irréversible.'
    cancel: 'Annuler'
    ok: 'Supprimer'
  replace:
    title: 'Remplacer le fichier'
    message: 'Remplacer « {label} » pour {registration} par « {name} » ? Le fichier actuel ne pourra pas être récupéré.'
    cancel: 'Annuler'
    ok: 'Remplacer'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  upload: 'Prześlij plik'
  replace: 'Zastąp plik'
  remove: 'Usuń plik'
  more: 'Więcej akcji'

error:
  upload_failed: 'Przesyłanie pliku nie powiodło się'

dialog:
  remove:
    title: 'Usuń plik'
    message: 'Usunąć „{label}” dla {registration}? Tej operacji nie można cofnąć.'
    cancel: 'Anuluj'
    ok: 'Usuń'
  replace:
    title: 'Zastąp plik'
    message: 'Zastąpić „{label}” dla {registration} plikiem „{name}”? Bieżącego pliku nie będzie można odzyskać.'
    cancel: 'Anuluj'
    ok: 'Zastąp'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  upload: 'Nahrát soubor'
  replace: 'Nahradit soubor'
  remove: 'Odebrat soubor'
  more: 'Další akce'

error:
  upload_failed: 'Nahrávání souboru se nezdařilo'

dialog:
  remove:
    title: 'Odebrat soubor'
    message: 'Odebrat „{label}“ pro {registration}? Tuto akci nelze vrátit zpět.'
    cancel: 'Zrušit'
    ok: 'Odebrat'
  replace:
    title: 'Nahradit soubor'
    message: 'Nahradit „{label}“ pro {registration} souborem „{name}“? Aktuální soubor nebude možné obnovit.'
    cancel: 'Zrušit'
    ok: 'Nahradit'
</i18n>
