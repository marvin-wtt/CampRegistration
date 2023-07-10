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
            {{ t(`title.${props.mode}`) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <translated-input
            v-model="room.name"
            :label="t('fields.name.label')"
            :rules="[(val) => !!val || t('fields.name.rules.required')]"
            outlined
            rounded
            :locales="props.locales"
          />

          <q-input
            v-model.number="room.capacity"
            type="number"
            :label="t('fields.capacity.label')"
            :rules="[(val) => !!val || t('fields.capacity.rules.required')]"
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
import { reactive, toRaw } from 'vue';
import { Room } from 'src/types/Room';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';

interface Props {
  room?: Room;
  mode: 'create' | 'edit';
  locales?: string[];
}

const props = defineProps<Props>();

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

const room = reactive<Room>(defaultRoom());

function defaultRoom(): Room {
  return structuredClone(toRaw(props.room));
}

function onOKClick(): void {
  const diff = room.capacity - room.roommates.length;
  if (diff > 0) {
    // Add elements
    room.roommates.push(...Array(diff).fill(null));
  } else if (diff < 0) {
    // Remove n elements
    room.roommates.splice(diff);
  }

  onDialogOK(room);
}

function onCancelClick() {
  onDialogCancel();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title:
  create: 'Create room'
  edit: 'Edit room'

fields:
  name:
    label: 'Name'
    rules:
      required: ''
  capacity:
    label: 'Number of beds'
    rules:
      required: ''

actions:
  save: 'Save'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title:
  create: 'Zimmer erstellen'
  edit: 'Zimmer bearbeiten'
fields:
  name:
    label: 'Name'
    rules:
      required: ''
  capacity:
    label: 'Anzahl der Betten'
    rules:
      required: ''

actions:
  save: 'Speichern'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  create: 'Créer une chambre'
  edit: 'Modifier la chambre'
fields:
  name:
    label: 'Nom'
    rules:
      required: ''
  capacity:
    label: 'Nombre de lits'
    rules:
      required: ''

actions:
  save: 'Enregistrer'
  cancel: 'Annuler'
</i18n>

<!-- TODO -->
<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
