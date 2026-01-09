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
            {{ t(`title`) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <!-- File -->
          <!-- TODO Maybe add reject message -->
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
              :rules="[
                (val?: string) => !!val || t('fields.field.rules.required'),
                (val: string) =>
                  !fields.includes(val) || t('fields.field.rules.unique'),
              ]"
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
import { type QSelectOption, useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, reactive, ref } from 'vue';
import type { ServiceFileCreateData } from '@camp-registration/common/entities';
import { uniqueName } from 'src/utils/uniqueName';
import { useCampFilesStore } from 'stores/camp-files-store';

defineEmits([...useDialogPluginComponent.emits]);

const campFileStore = useCampFilesStore();

const { t } = useI18n();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const fileData = reactive<ServiceFileCreateData>({
  accessLevel: 'public',
} as ServiceFileCreateData);

const loading = ref<boolean>(false);

const fields = computed<string[]>(() => {
  const files = campFileStore.data ?? [];

  return files.map((file) => file.field).filter((field) => field != null);
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
    // File name without extension
    fileData.name = fileData.file.name.replace(/\.[^/.]+$/, '');
  }

  // Generate default
  if (fileData.name && !fileData.field) {
    const name = fileData.name.trim().toLowerCase().replaceAll(' ', '-');
    fileData.field = uniqueName(name, fields.value);
  }
}

async function onOKClick(): Promise<void> {
  loading.value = true;
  try {
    const file = await campFileStore.createEntry(fileData);

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
