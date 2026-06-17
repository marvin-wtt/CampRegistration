<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none file-dialog">
      <q-form
        @submit="onOKClick"
        @reset="onCancelClick"
      >
        <q-card-section>
          <div class="text-h6">
            {{ dialogTitle }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <!-- File -->
          <q-file
            v-if="!isEditMode"
            v-model="fileData.file"
            :label="t('fields.file.label')"
            :rules="[
              (val?: File | null) => !!val || t('fields.file.rules.required'),
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

          <template v-if="showMetadataFields">
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
              :maxlength="MAX_FIELD_LENGTH"
              :readonly="isFieldLocked"
              :rules="[
                (val?: string) => !!val || t('fields.field.rules.required'),
                (val?: string) =>
                  (val?.length ?? 0) <= MAX_FIELD_LENGTH ||
                  t('fields.field.rules.max_length', {
                    max: MAX_FIELD_LENGTH,
                  }),
                (val?: string) =>
                  !val ||
                  isValidFieldName(val) ||
                  t('fields.field.rules.format'),
              ]"
              counter
              outlined
              rounded
              @blur="normalizeField"
            />

            <!-- Locale -->
            <q-select
              v-model="fileData.locale"
              :options="localeOptions"
              :label="t('fields.locale.label')"
              :hint="t('fields.locale.hint')"
              :readonly="isLocaleLocked"
              emit-value
              map-options
              outlined
              rounded
            />

            <q-banner
              v-if="hasDuplicateFieldLocale"
              dense
              rounded
              class="duplicate-warning"
            >
              <template #avatar>
                <q-icon name="warning_amber" />
              </template>
              {{ t('fields.field_locale.warning') }}
            </q-banner>

            <!-- Access -->
            <q-select
              v-model="fileData.accessLevel"
              :options="accessLevelOptions"
              :label="t('fields.access_level.label')"
              :rules="[
                (val?: string) =>
                  !!val || t('fields.access_level.rules.required'),
              ]"
              :readonly="isAccessLevelLocked"
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
            :label="submitLabel"
            :loading="loading"
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
  ServiceFileUpdateData,
  ServiceFile,
} from '@camp-registration/common/entities';
import { useCampFilesStore } from 'stores/camp-files-store';
import { useCampDetailsStore } from 'stores/camp-details-store';

const MAX_FIELD_LENGTH = 40;
const FALLBACK_FIELD_NAME = 'file';
const FIELD_NAME_PATTERN = /^[a-z0-9_-]+$/;

interface ServiceFileFormData {
  name?: string | undefined;
  field?: string | undefined;
  locale?: string | null;
  accessLevel?: 'private' | 'public' | undefined;
  file?: File | null;
}

const { initialField, initialLocale, fileToReplace, fileToEdit } = defineProps<{
  initialField?: string;
  initialLocale?: string | null;
  fileToReplace?: ServiceFile;
  fileToEdit?: ServiceFile;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const campFileStore = useCampFilesStore();
const campStore = useCampDetailsStore();

const { t } = useI18n();
const quasar = useQuasar();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const fileData = reactive<ServiceFileFormData>({
  accessLevel: normalizeAccessLevel(
    fileToEdit?.accessLevel ?? fileToReplace?.accessLevel,
  ),
  field: fileToEdit?.field ?? fileToReplace?.field ?? initialField,
  locale: fileToEdit?.locale ?? fileToReplace?.locale ?? initialLocale ?? null,
  name: fileToEdit?.name,
});

const loading = ref<boolean>(false);

type DialogMode = 'upload' | 'replace' | 'edit';

// Single source of truth for the dialog's mode. Title, submit label and the
// submit dispatch all derive from this so they can never disagree.
const mode = computed<DialogMode>(() => {
  if (fileToEdit !== undefined) {
    return 'edit';
  }
  if (fileToReplace !== undefined) {
    return 'replace';
  }
  return 'upload';
});

const isEditMode = computed(() => mode.value === 'edit');

const isReplaceMode = computed(() => mode.value === 'replace');

const isSlotUploadMode = computed(() => initialField !== undefined);

const showMetadataFields = computed(
  () => isEditMode.value || fileData.file != null,
);

const isFieldLocked = computed(
  () => isReplaceMode.value || isSlotUploadMode.value,
);

const isLocaleLocked = computed(
  // Lock only when a concrete locale was supplied (e.g. replace, or a slot that
  // targets a specific language). A locale-less slot (initialLocale === null)
  // stays editable so the user can choose one.
  () => isReplaceMode.value || initialLocale != null,
);

const isAccessLevelLocked = computed(
  () => isReplaceMode.value || isSlotUploadMode.value,
);

const activeFileId = computed(() => fileToEdit?.id ?? fileToReplace?.id);

const hasDuplicateFieldLocale = computed<boolean>(() => {
  const field = fileData.field?.trim();
  if (!field) {
    return false;
  }

  const locale = fileData.locale ?? null;
  const files = campFileStore.data ?? [];

  return files.some(
    (file) =>
      file.id !== activeFileId.value &&
      file.field === field &&
      file.locale === locale,
  );
});

const dialogTitle = computed<string>(() => t(`title.${mode.value}`));

const submitLabel = computed<string>(() => {
  const action = mode.value === 'edit' ? 'update' : mode.value;
  return t(`action.${action}`);
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

function normalizeAccessLevel(
  accessLevel?: string | null,
): 'private' | 'public' {
  return accessLevel === 'private' ? 'private' : 'public';
}

function isValidFieldName(value: string): boolean {
  return FIELD_NAME_PATTERN.test(value);
}

function onFileUpdate() {
  if (!fileData.file) {
    return;
  }

  const displayName = stripExtension(fileData.file.name);

  if (!fileData.name || fileData.name.trim().length === 0) {
    fileData.name = displayName;
  }

  if (fileData.name && !fileData.field) {
    fileData.field = createSuggestedFieldName(fileData.name);
  }
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

// Maps common document-name keywords (in any supported language) to the
// conventional form-slot field they usually fill. Add new keywords or
// languages in this single table.
const CANONICAL_FIELD_SYNONYMS: Record<string, readonly string[]> = {
  toc: ['toc', 'agb', 'terms', 'conditions'],
  rules: ['rules', 'rule', 'regeln', 'ordnung'],
};

function createSuggestedFieldName(name: string): string {
  const slug = slugifyFieldName(name);
  const words = new Set(slug.split('-'));

  for (const [field, synonyms] of Object.entries(CANONICAL_FIELD_SYNONYMS)) {
    if (synonyms.some((synonym) => words.has(synonym))) {
      return field;
    }
  }

  return trimFieldName(slug);
}

function slugifyFieldName(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || FALLBACK_FIELD_NAME;
}

function trimFieldName(value: string): string {
  return value
    .slice(0, MAX_FIELD_LENGTH)
    .replace(/[-_]+$/g, '')
    .replace(/^[-_]+/g, '');
}

function normalizeField() {
  if (!fileData.field) {
    return;
  }

  fileData.field = trimFieldName(slugifyFieldName(fileData.field));
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
    const metadata = fileMetadata();

    let file: ServiceFile;
    if (fileToEdit) {
      file = await campFileStore.updateEntry(fileToEdit.id, metadata);
    } else if (fileToReplace) {
      file = await campFileStore.replaceFile(
        fileToReplace,
        createData(metadata),
      );
    } else {
      file = await campFileStore.createEntry(createData(metadata));
    }

    onDialogOK(file);
  } finally {
    loading.value = false;
  }
}

function fileMetadata(): ServiceFileUpdateData {
  const metadata: ServiceFileUpdateData = {
    locale: fileData.locale ?? null,
  };
  const name = fileData.name?.trim();
  const field = fileData.field?.trim();

  if (name) {
    metadata.name = name;
  }
  if (field) {
    metadata.field = field;
  }
  if (fileData.accessLevel) {
    metadata.accessLevel = fileData.accessLevel;
  }

  return metadata;
}

function createData(metadata: ServiceFileUpdateData): ServiceFileCreateData {
  if (!fileData.file) {
    throw new Error('No file selected');
  }

  return {
    ...metadata,
    file: fileData.file,
  };
}

function onCancelClick() {
  onDialogCancel();
}
</script>

<style scoped>
.file-dialog {
  width: min(560px, calc(100vw - 32px));
  max-width: 560px;
}

.duplicate-warning {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}

.duplicate-warning .q-icon {
  color: inherit;
}
</style>

<i18n lang="yaml" locale="en">
title:
  upload: 'Upload file'
  replace: 'Replace file'
  edit: 'Edit file'

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
      max_length: 'Use {max} characters or fewer'
      format: 'Use lowercase letters, numbers, hyphens or underscores'
  field_locale:
    warning: 'Another file already uses this identifier and language. The newer file may hide the older one in forms.'
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
  upload: 'Upload'
  replace: 'Replace'
  update: 'Update'
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
title:
  upload: 'Datei hochladen'
  replace: 'Datei ersetzen'
  edit: 'Datei bearbeiten'

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
      max_length: 'Verwenden Sie höchstens {max} Zeichen'
      format: 'Verwenden Sie Kleinbuchstaben, Zahlen, Bindestriche oder Unterstriche'
  field_locale:
    warning: 'Eine andere Datei verwendet bereits diese Kennung und Sprache. Die neuere Datei kann die ältere im Formular überdecken.'
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
  upload: 'Hochladen'
  replace: 'Ersetzen'
  update: 'Aktualisieren'
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
title:
  upload: 'Téléverser un fichier'
  replace: 'Remplacer le fichier'
  edit: 'Modifier le fichier'

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
      max_length: 'Utilisez {max} caractères au maximum'
      format: 'Utilisez des minuscules, des chiffres, des tirets ou des traits de soulignement'
  field_locale:
    warning: "Un autre fichier utilise déjà cet identifiant et cette langue. Le fichier le plus récent peut masquer l'ancien dans les formulaires."
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
  upload: 'Téléverser'
  replace: 'Remplacer'
  update: 'Mettre à jour'
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
title:
  upload: 'Prześlij plik'
  replace: 'Zastąp plik'
  edit: 'Edytuj plik'

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
      max_length: 'Użyj maksymalnie {max} znaków'
      format: 'Użyj małych liter, cyfr, łączników lub podkreśleń'
  field_locale:
    warning: 'Inny plik używa już tego identyfikatora i języka. Nowszy plik może ukryć starszy w formularzach.'
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
  upload: 'Prześlij'
  replace: 'Zastąp'
  update: 'Aktualizuj'
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
title:
  upload: 'Nahrát soubor'
  replace: 'Nahradit soubor'
  edit: 'Upravit soubor'

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
      max_length: 'Použijte nejvýše {max} znaků'
      format: 'Použijte malá písmena, číslice, pomlčky nebo podtržítka'
  field_locale:
    warning: 'Jiný soubor již používá tento identifikátor a jazyk. Novější soubor může ve formulářích skrýt starší.'
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
  upload: 'Nahrát'
  replace: 'Nahradit'
  update: 'Aktualizovat'
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
