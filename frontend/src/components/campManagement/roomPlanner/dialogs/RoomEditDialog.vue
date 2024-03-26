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
          <translated-input
            v-model="modifiedRoom.name"
            :label="t('fields.name.label')"
            :rules="[
              (val: string | Record<string, string> | undefined) =>
                !!val || t('fields.name.rules.required'),
            ]"
            outlined
            rounded
            :locales="props.locales"
          />
        </q-card-section>

        <!-- action buttons -->
        <q-card-actions align="right">
          <q-btn
            type="reset"
            outline
            rounded
            color="primary"
            :label="t('actions.cancel')"
          />
          <q-btn
            type="submit"
            rounded
            color="primary"
            :label="t('actions.save')"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { reactive } from 'vue';
import type { RoomUpdateData } from '@camp-registration/common/entities';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';

const props = defineProps<{
  room: RoomUpdateData;
  locales?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const modifiedRoom = reactive<RoomUpdateData>(props.room);

function onOKClick(): void {
  onDialogOK(modifiedRoom);
}

function onCancelClick() {
  onDialogCancel();
}
</script>

<style scoped></style>

<!-- TODO Complete translations -->
<i18n lang="yaml" locale="en">
title: 'Edit room'

fields:
  name:
    label: 'Name'
    rules:
      required: ''

actions:
  save: 'Save'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zimmer bearbeiten'
fields:
  name:
    label: 'Name'
    rules:
      required: ''

actions:
  save: 'Speichern'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier la chambre'
fields:
  name:
    label: 'Nom'
    rules:
      required: ''

actions:
  save: 'Enregistrer'
  cancel: 'Annuler'
</i18n>
