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
        <q-card-section>
          <div class="text-h6">
            {{ t('title') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <!-- File -->
          <q-file
            v-model="fileData.file"
            :label="t('fields.file.label')"
            :rules="[
              (val?: File) => !!val || t('fields.access_level.rules.required'),
            ]"
            clearable
            bottom-slots
            counter
            outlined
            rounded
            :max-file-size="100e6"
            accept="image/*, application/pdf"
            @update:model-value="onFileUpdate"
            @rejected="onFileRejected"
          >
            <template #prepend>
              <q-icon
                name="cloud_upload"
                @click.stop.prevent
              />
            </template>
          </q-file>

          <template v-if="fileData.file">
            <!-- Name -->
            <q-input
              v-model="fileData.name"
              :label="t('fields.name.label')"
              :rules="[
                (val?: string) => !!val || t('fields.name.rules.required'),
              ]"
              outlined
              rounded
            />

            <!-- Field -->
            <q-input
              v-model="fileData.field"
              :label="t('fields.field.label')"
              :hint="t('fields.field.hint')"
              :readonly="isReplaceMode"
              :rules="[
                (val?: string) => !!val || t('fields.field.rules.required'),
                (val: string) =>
                  isReplaceMode ||
                  !fields.includes(val) ||
                  t('fields.field.rules.unique'),
              ]"
              outlined
              rounded
            />

            <!-- Locale -->
            <q-select
              v-model="fileData.locale"
              :options="localeOptions"
              :label="t('fields.locale.label')"
              :hint="t('fields.locale.hint')"
              :readonly="initialLocale !== null"
              emit-value
              map-options
              outlined
              rounded
            />

            <!-- Access -->
            <q-select
              v-model="fileData.accessLevel"
              :options="accessLevelOptions"
              :label="t('fields.access_level.label')"
              :rules="[
                (val?: string) =>
                  !!val || t('fields.access_level.rules.required'),
              ]"
              :readonly="isReplaceMode"
              emit-value
              map-options
              outlined
              rounded
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>
                      {{ scope.opt.label }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ scope.opt.description }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </template>
        </q-card-section>

        <!-- action buttons -->
        <q-card-actions align="right">
          <q-btn
            type="reset"
            outline
            rounded
            color="primary"
            :label="t('action.cancel')"
          />
          <q-btn
            type="submit"
            rounded
            color="primary"
            :label="t('action.ok')"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import {
  type QSelectOption,
  type QRejectedEntry,
  useDialogPluginComponent,
  useQuasar,
} from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, reactive, ref } from 'vue';
import type {
  ServiceFileCreateData,
  ServiceFile,
} from '@camp-registration/common/entities';
import { uniqueName } from 'src/utils/uniqueName';
import { useCampFilesStore } from 'stores/camp-files-store';
import { useCampDetailsStore } from 'stores/camp-details-store';

const { initialField, initialLocale, fileToReplace } = defineProps<{
  initialField?: string;
  initialLocale?: string | null;
  fileToReplace?: ServiceFile;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const campFileStore = useCampFilesStore();
const campStore = useCampDetailsStore();

const { t } = useI18n();
const quasar = useQuasar();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const fileData = reactive<ServiceFileCreateData>({
  accessLevel: 'public',
  field: fileToReplace?.field ?? initialField,
  locale: fileToReplace?.locale ?? initialLocale ?? null,
} as ServiceFileCreateData);

const loading = ref<boolean>(false);

const isReplaceMode = computed(
  () => fileToReplace !== undefined || initialField !== undefined,
);

const fields = computed<string[]>(() => {
  if (isReplaceMode.value) {
    return [];
  }
  const files = campFileStore.data ?? [];

  return files.map((file) => file.field).filter((field) => field != null);
});

const localeOptions = computed<QSelectOption<string | null>[]>(() => {
  const locales = campStore.data?.locales ?? [];
  return [
    { label: t('fields.locale.default'), value: null },
    ...locales.map((locale) => ({ label: locale, value: locale })),
  ];
});

interface AccessLevelOption extends QSelectOption {
  description?: string;
}

const accessLevelOptions: AccessLevelOption[] = [
  {
    label: t('access_level.private.label'),
    value: 'private',
    description: t('access_level.private.description'),
  },
  {
    label: t('access_level.public.label'),
    value: 'public',
    description: t('access_level.public.description'),
  },
];

function onFileUpdate() {
  if (!fileData.name || fileData.name.trim().length === 0) {
    fileData.name = fileData.file.name.replace(/\.[^/.]+$/, '');
  }

  if (fileData.name && !fileData.field) {
    const name = fileData.name.trim().toLowerCase().replaceAll(' ', '-');
    fileData.field = uniqueName(name, fields.value);
  }
}

function onFileRejected(rejectedEntries: QRejectedEntry[]) {
  const reasons = new Set(
    rejectedEntries.map((entry) => entry.failedPropValidation),
  );

  const message = reasons.has('max-file-size')
    ? t('fields.file.rejected.max_file_size')
    : reasons.has('accept')
      ? t('fields.file.rejected.accept')
      : t('fields.file.rejected.generic');

  quasar.notify({
    type: 'negative',
    message,
  });
}

async function onOKClick(): Promise<void> {
  loading.value = true;
  try {
    const file = fileToReplace
      ? await campFileStore.replaceFile(fileToReplace, fileData)
      : await campFileStore.createEntry(fileData);

    onDialogOK(file);
  } finally {
    loading.value = false;
  }
}

function onCancelClick() {
  onDialogCancel();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Upload file'

fields:
  access_level:
    label: 'Access'
    rules:
      required: 'This field is required'
  field:
    label: 'Identifier'
    hint: 'Used to reference the file in the form'
    rules:
      required: 'This field is required'
      unique: 'Another file with this identifier already exists'
  file:
    label: 'File'
    rules:
      required: 'Please select a file to upload'
    rejected:
      max_file_size: 'The file is too large. The maximum file size is 100 MB.'
      accept: 'This file type is not allowed. Please select an image or PDF.'
      generic: 'The selected file could not be added.'
  locale:
    label: 'Language'
    hint: 'Leave as default to apply to all languages'
    default: 'Default (all languages)'
  name:
    label: 'Name'
    rules:
      required: 'Please select the new file name'

action:
  ok: 'Upload'
  cancel: 'Cancel'

access_level:
  public:
    label: 'Public'
    description: 'Visible to everyone'
  private:
    label: 'Private'
    description: 'Visible only to camp managers'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Datei hochladen'

fields:
  access_level:
    label: 'Zugriff'
    rules:
      required: 'Dieses Feld ist erforderlich'
  field:
    label: 'Kennung'
    hint: 'Wird verwendet, um auf die Datei im Formular zu verweisen'
    rules:
      required: 'Dieses Feld ist erforderlich'
      unique: 'Eine Datei mit dieser Kennung existiert bereits'
  file:
    label: 'Datei'
    rules:
      required: 'Bitte wählen Sie eine Datei zum Hochladen aus'
    rejected:
      max_file_size: 'Die Datei ist zu groß. Die maximale Dateigröße beträgt 100 MB.'
      accept: 'Dieser Dateityp ist nicht zulässig. Bitte wählen Sie ein Bild oder PDF.'
      generic: 'Die ausgewählte Datei konnte nicht hinzugefügt werden.'
  locale:
    label: 'Sprache'
    hint: 'Leer lassen, um auf alle Sprachen anzuwenden'
    default: 'Standard (alle Sprachen)'
  name:
    label: 'Name'
    rules:
      required: 'Bitte geben Sie den neuen Dateinamen ein'

action:
  ok: 'Hochladen'
  cancel: 'Abbrechen'

access_level:
  public:
    label: 'Öffentlich'
    description: 'Für alle sichtbar'
  private:
    label: 'Privat'
    description: 'Nur für Camp-Manager sichtbar'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Téléverser un fichier'

fields:
  access_level:
    label: 'Accès'
    rules:
      required: 'Ce champ est requis'
  field:
    label: 'Identifiant'
    hint: 'Utilisé pour référencer le fichier dans le formulaire'
    rules:
      required: 'Ce champ est requis'
      unique: 'Un autre fichier avec cet identifiant existe déjà'
  file:
    label: 'Fichier'
    rules:
      required: 'Veuillez sélectionner un fichier à téléverser'
    rejected:
      max_file_size: 'Le fichier est trop volumineux. La taille maximale est de 100 Mo.'
      accept: "Ce type de fichier n'est pas autorisé. Veuillez sélectionner une image ou un PDF."
      generic: "Le fichier sélectionné n'a pas pu être ajouté."
  locale:
    label: 'Langue'
    hint: 'Laisser par défaut pour appliquer à toutes les langues'
    default: 'Défaut (toutes les langues)'
  name:
    label: 'Nom'
    rules:
      required: 'Veuillez choisir le nouveau nom de fichier'

action:
  ok: 'Téléverser'
  cancel: 'Annuler'

access_level:
  public:
    label: 'Public'
    description: 'Visible par tout le monde'
  private:
    label: 'Privé'
    description: 'Visible uniquement par les gestionnaires de camp'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Prześlij plik'

fields:
  access_level:
    label: 'Dostęp'
    rules:
      required: 'To pole jest wymagane'
  field:
    label: 'Identyfikator'
    hint: 'Używany do odwoływania się do pliku w formularzu'
    rules:
      required: 'To pole jest wymagane'
      unique: 'Plik o tym identyfikatorze już istnieje'
  file:
    label: 'Plik'
    rules:
      required: 'Wybierz plik do przesłania'
    rejected:
      max_file_size: 'Plik jest za duży. Maksymalny rozmiar pliku to 100 MB.'
      accept: 'Ten typ pliku jest niedozwolony. Wybierz obraz lub plik PDF.'
      generic: 'Nie udało się dodać wybranego pliku.'
  locale:
    label: 'Język'
    hint: 'Pozostaw domyślnie, aby zastosować do wszystkich języków'
    default: 'Domyślny (wszystkie języki)'
  name:
    label: 'Nazwa'
    rules:
      required: 'Podaj nową nazwę pliku'

action:
  ok: 'Prześlij'
  cancel: 'Anuluj'

access_level:
  public:
    label: 'Publiczny'
    description: 'Widoczny dla wszystkich'
  private:
    label: 'Prywatny'
    description: 'Widoczny tylko dla menedżerów obozu'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Nahrát soubor'

fields:
  access_level:
    label: 'Přístup'
    rules:
      required: 'Toto pole je povinné'
  field:
    label: 'Identifikátor'
    hint: 'Používá se pro odkazování na soubor ve formuláři'
    rules:
      required: 'Toto pole je povinné'
      unique: 'Soubor s tímto identifikátorem již existuje'
  file:
    label: 'Soubor'
    rules:
      required: 'Vyberte soubor k nahrání'
    rejected:
      max_file_size: 'Soubor je příliš velký. Maximální velikost souboru je 100 MB.'
      accept: 'Tento typ souboru není povolen. Vyberte obrázek nebo PDF.'
      generic: 'Vybraný soubor se nepodařilo přidat.'
  locale:
    label: 'Jazyk'
    hint: 'Ponechte výchozí pro použití ve všech jazycích'
    default: 'Výchozí (všechny jazyky)'
  name:
    label: 'Název'
    rules:
      required: 'Zadejte nový název souboru'

action:
  ok: 'Nahrát'
  cancel: 'Zrušit'

access_level:
  public:
    label: 'Veřejný'
    description: 'Viditelné pro všechny'
  private:
    label: 'Soukromý'
    description: 'Viditelné pouze pro správce tábora'
</i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
