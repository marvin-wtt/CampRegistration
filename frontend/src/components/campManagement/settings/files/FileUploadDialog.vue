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
            v-model="file.file"
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

          <template v-if="file.file">
            <!-- Name -->
            <q-input
              v-model="file.name"
              :label="t('fields.name.label')"
              :rules="[
                (val?: string) => !!val || t('fields.name.rules.required'),
              ]"
              outlined
              rounded
            />

            <!-- Field -->
            <q-input
              v-model="file.field"
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
              v-model="file.accessLevel"
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
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const file = reactive<ServiceFileCreateData>({
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
  if (!file.name || file.name.trim().length === 0) {
    // File name without extension
    file.name = file.file.name.replace(/\.[^/.]+$/, '');
  }

  // Generate default
  if (file.name && !file.field) {
    const name = file.name.trim().toLowerCase().replaceAll(' ', '-');
    file.field = uniqueName(name, fields.value);
  }
}

async function onOKClick(): Promise<void> {
  loading.value = true;
  try {
    await campFileStore.createEntry(file);

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

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
