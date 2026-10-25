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
            <template #file="{ file }">
              <file-chip :name="file.name" />
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

            <!-- Group: only an event with several groups can tell them apart -->
            <q-select
              v-if="hasSeveralGroups"
              v-model="fileData.group"
              :options="groupOptions"
              :label="t('fields.group.label')"
              :hint="t('fields.group.hint')"
              :readonly="isGroupLocked"
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
              {{
                t(
                  isEditMode
                    ? 'fields.field_locale.warning_edit'
                    : 'fields.field_locale.warning',
                )
              }}
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
import FileChip from '@/components/common/inputs/FileChip.vue';
import {
  type QSelectOption,
  type QRejectedEntry,
  useDialogPluginComponent,
  useQuasar,
} from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, reactive, ref, watch } from 'vue';
import type {
  ServiceFileCreateData,
  ServiceFileUpdateData,
  ServiceFile,
} from '@camp-registration/common/entities';
import { useEventFilesStore } from '@/stores/event-files-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { countryName } from '@/utils/countries';
import {
  EVENT_BANNER_SLOT,
  EVENT_LOGO_SLOT,
} from '@camp-registration/common/form';
import {
  FIELD_NAME_PATTERN,
  MAX_FIELD_LENGTH,
  slugifyFieldName,
  trimFieldName,
} from '@/utils/fileField';

interface ServiceFileFormData {
  name?: string | undefined;
  field?: string | undefined;
  locale?: string | null;
  group?: string | null;
  accessLevel?: 'private' | 'public' | undefined;
  file?: File | null;
}

const {
  initialField,
  initialLocale,
  initialGroup,
  initialAccessLevel,
  fileToReplace,
  fileToEdit,
} = defineProps<{
  initialField?: string;
  initialLocale?: string | null;
  // The group a missing file is for; preset, but another can be chosen.
  initialGroup?: string | null;
  initialAccessLevel?: string;
  fileToReplace?: ServiceFile;
  fileToEdit?: ServiceFile;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const eventFileStore = useEventFilesStore();
const eventStore = useEventDetailsStore();

const { t, locale } = useI18n();
const quasar = useQuasar();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const fileData = reactive<ServiceFileFormData>({
  accessLevel: normalizeAccessLevel(
    initialAccessLevel ?? fileToEdit?.accessLevel ?? fileToReplace?.accessLevel,
  ),
  field: fileToEdit?.field ?? fileToReplace?.field ?? initialField,
  locale: fileToEdit?.locale ?? fileToReplace?.locale ?? initialLocale ?? null,
  group: fileToEdit?.group ?? fileToReplace?.group ?? initialGroup ?? null,
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
  // Lock when a concrete locale was supplied (e.g. replace, or a slot that
  // targets a specific language) — a locale-less slot (initialLocale === null)
  // otherwise stays editable so the user can choose one. The logo and banner
  // are the exception: they aren't localized, so their locale stays fixed.
  () =>
    isReplaceMode.value ||
    initialLocale != null ||
    initialField === EVENT_LOGO_SLOT ||
    initialField === EVENT_BANNER_SLOT,
);

// The logo and banner are the event's own, the same in every group — also
// when an identifier is typed to one of them, which the server would reject
// with a group set.
const isGrouplessField = computed<boolean>(() => {
  const field = fileData.field?.trim();
  return field === EVENT_LOGO_SLOT || field === EVENT_BANNER_SLOT;
});

const isGroupLocked = computed(
  () => isReplaceMode.value || isGrouplessField.value,
);

watch(isGrouplessField, (groupless) => {
  if (groupless) {
    fileData.group = null;
  }
});

const isAccessLevelLocked = computed(
  () => isReplaceMode.value || isSlotUploadMode.value,
);

const activeFileId = computed(() => fileToEdit?.id ?? fileToReplace?.id);

// The file already occupying the (field, locale, group) this upload targets, if
// any. Submitting an upload over it replaces that file instead of leaving a
// duplicate behind; an edit can't replace, so it only gets the warning.
const duplicateFile = computed<ServiceFile | undefined>(() => {
  const field = fileData.field?.trim();
  if (!field) {
    return undefined;
  }

  const locale = fileData.locale ?? null;
  const group = fileData.group ?? null;
  const files = eventFileStore.data ?? [];

  return files.find(
    (file) =>
      file.id !== activeFileId.value &&
      file.field === field &&
      file.locale === locale &&
      file.group === group,
  );
});

const hasDuplicateFieldLocale = computed<boolean>(
  () => duplicateFile.value !== undefined,
);

const dialogTitle = computed<string>(() => t(`title.${mode.value}`));

const submitLabel = computed<string>(() => {
  const action = mode.value === 'edit' ? 'update' : mode.value;
  return t(`action.${action}`);
});

const localeOptions = computed<QSelectOption<string | null>[]>(() => {
  const locales = eventStore.data?.locales ?? [];
  return [
    { label: t('fields.locale.default'), value: null },
    ...locales.map((code) => ({ label: code, value: code })),
  ];
});

// An event's groups are its countries.
const eventGroups = computed<string[]>(() => eventStore.data?.countries ?? []);
const hasSeveralGroups = computed<boolean>(() => eventGroups.value.length > 1);

const groupOptions = computed<QSelectOption<string | null>[]>(() => {
  const groups = eventGroups.value;
  return [
    { label: t('fields.group.default'), value: null },
    ...groups.map((group) => ({
      label: countryName(group, locale.value),
      value: group,
    })),
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

function normalizeField() {
  if (!fileData.field || isFieldLocked.value) {
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
      file = await eventFileStore.updateEntry(fileToEdit.id, metadata);
    } else if (fileToReplace) {
      file = await eventFileStore.replaceFile(
        fileToReplace,
        createData(metadata),
      );
    } else if (duplicateFile.value) {
      file = await eventFileStore.replaceFile(
        duplicateFile.value,
        createData(metadata),
      );
    } else {
      file = await eventFileStore.createEntry(createData(metadata));
    }

    onDialogOK(file);
  } finally {
    loading.value = false;
  }
}

function fileMetadata(): ServiceFileUpdateData {
  const metadata: ServiceFileUpdateData = {
    locale: fileData.locale ?? null,
    group: fileData.group ?? null,
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
  group:
    label: 'Group'
    hint: 'Leave as default to apply to all groups'
    default: 'Default (all groups)'
  field:
    label: 'Identifier'
    hint: 'Used to reference the file in the form'
    rules:
      required: 'This field is required'
      max_length: 'Use {max} characters or fewer'
      format: 'Use lowercase letters, numbers, hyphens or underscores'
  field_locale:
    warning: 'Another file already uses this identifier, language and group. Uploading will replace it.'
    warning_edit: 'Another file already uses this identifier, language and group. Only one of them will be shown in the form.'
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
    description: 'Visible only to event managers'
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
  group:
    label: 'Gruppe'
    hint: 'Leer lassen, um auf alle Gruppen anzuwenden'
    default: 'Standard (alle Gruppen)'
  field:
    label: 'Kennung'
    hint: 'Wird verwendet, um auf die Datei im Formular zu verweisen'
    rules:
      required: 'Dieses Feld ist erforderlich'
      max_length: 'Verwende höchstens {max} Zeichen'
      format: 'Verwende Kleinbuchstaben, Zahlen, Bindestriche oder Unterstriche'
  field_locale:
    warning: 'Eine andere Datei verwendet bereits diese Kennung, Sprache und Gruppe. Beim Hochladen wird sie ersetzt.'
    warning_edit: 'Eine andere Datei verwendet bereits diese Kennung, Sprache und Gruppe. Im Formular wird nur eine davon angezeigt.'
  file:
    label: 'Datei'
    rules:
      required: 'Bitte wähle eine Datei zum Hochladen aus'
    rejected:
      max_file_size: 'Die Datei ist zu groß. Die maximale Dateigröße beträgt 100 MB.'
      accept: 'Dieser Dateityp ist nicht zulässig. Bitte wähle ein Bild oder PDF.'
      generic: 'Die ausgewählte Datei konnte nicht hinzugefügt werden.'
  locale:
    label: 'Sprache'
    hint: 'Leer lassen, um auf alle Sprachen anzuwenden'
    default: 'Standard (alle Sprachen)'
  name:
    label: 'Name'
    rules:
      required: 'Bitte gib den neuen Dateinamen ein'

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
    description: 'Nur für Veranstaltungsmanager sichtbar'
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
  group:
    label: 'Groupe'
    hint: 'Laisser par défaut pour appliquer à tous les groupes'
    default: 'Par défaut (tous les groupes)'
  field:
    label: 'Identifiant'
    hint: 'Utilisé pour référencer le fichier dans le formulaire'
    rules:
      required: 'Ce champ est requis'
      max_length: 'Utilisez {max} caractères au maximum'
      format: 'Utilisez des minuscules, des chiffres, des tirets ou des traits de soulignement'
  field_locale:
    warning: 'Un autre fichier utilise déjà cet identifiant, cette langue et ce groupe. Le téléversement le remplacera.'
    warning_edit: 'Un autre fichier utilise déjà cet identifiant, cette langue et ce groupe. Un seul des deux sera affiché dans le formulaire.'
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
    description: "Visible uniquement par les gestionnaires d'événement"
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
  group:
    label: 'Grupa'
    hint: 'Pozostaw domyślnie, aby zastosować do wszystkich grup'
    default: 'Domyślnie (wszystkie grupy)'
  field:
    label: 'Identyfikator'
    hint: 'Używany do odwoływania się do pliku w formularzu'
    rules:
      required: 'To pole jest wymagane'
      max_length: 'Użyj maksymalnie {max} znaków'
      format: 'Użyj małych liter, cyfr, łączników lub podkreśleń'
  field_locale:
    warning: 'Inny plik używa już tego identyfikatora, języka i grupy. Przesłanie go zastąpi.'
    warning_edit: 'Inny plik używa już tego identyfikatora, języka i grupy. W formularzu zostanie wyświetlony tylko jeden z nich.'
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
    description: 'Widoczny tylko dla menedżerów wydarzenia'
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
  group:
    label: 'Skupina'
    hint: 'Ponechte výchozí pro použití ve všech skupinách'
    default: 'Výchozí (všechny skupiny)'
  field:
    label: 'Identifikátor'
    hint: 'Používá se pro odkazování na soubor ve formuláři'
    rules:
      required: 'Toto pole je povinné'
      max_length: 'Použijte nejvýše {max} znaků'
      format: 'Použijte malá písmena, číslice, pomlčky nebo podtržítka'
  field_locale:
    warning: 'Jiný soubor již používá tento identifikátor, jazyk a skupinu. Nahráním jej nahradíte.'
    warning_edit: 'Jiný soubor již používá tento identifikátor, jazyk a skupinu. Ve formuláři se zobrazí jen jeden z nich.'
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
    description: 'Viditelné pouze pro správce akce'
</i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
