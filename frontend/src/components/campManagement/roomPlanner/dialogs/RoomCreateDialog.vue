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
            v-model="room.name"
            :label="t('fields.name.label')"
            :rules="[
              (val: string | Record<string, string> | undefined) =>
                !!val || t('fields.name.rules.required'),
            ]"
            outlined
            rounded
            :locales="props.locales"
          />

          <q-input
            v-model.number="room.capacity"
            type="number"
            :label="t('fields.capacity.label')"
            :rules="[
              (val: number | undefined) =>
                !!val || t('fields.capacity.rules.required'),
              (val: number) => val > 0 || t('fields.capacity.rules.positive'),
            ]"
            outlined
            rounded
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
import type { RoomCreateData } from '@camp-registration/common/entities';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';

const props = defineProps<{
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

const room = reactive<RoomCreateData>({
  name: '',
  capacity: 0,
});

function onOKClick(): void {
  onDialogOK(room);
}

function onCancelClick() {
  onDialogCancel();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Create room'

fields:
  name:
    label: 'Name'
    rules:
      required: 'Name is required'
  capacity:
    label: 'Number of beds'
    rules:
      required: 'Beds is required'
      positive: 'Room must have at least one bed'

actions:
  save: 'Save'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zimmer erstellen'

fields:
  name:
    label: 'Name'
    rules:
      required: 'Name ist erforderlich'
  capacity:
    label: 'Anzahl der Betten'
    rules:
      required: 'Betten sind erforderlich'
      positive: 'Zimmer muss mindestens ein Bett haben'

actions:
  save: 'Speichern'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Créer une chambre'

fields:
  name:
    label: 'Nom'
    rules:
      required: 'Le nom est requis'
  capacity:
    label: 'Nombre de lits'
    rules:
      required: 'Le nombre de lits est requis'
      positive: 'La chambre doit avoir au moins un lit'

actions:
  save: 'Enregistrer'
  cancel: 'Annuler'
</i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
