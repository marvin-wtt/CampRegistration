<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-form>
        <q-card-section>
          <div class="text-h6">
            {{ t(`title.${props.mode}`) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <q-input
            v-model="room.name"
            :label="t('fields.name.label')"
            :rules="[(val) => !!val || t('fields.name.rules.required')]"
            outlined
            rounded
          />

          <q-input
            v-model.number="capacity"
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
            @click="onDialogCancel"
          />
          <q-btn
            type="submit"
            rounded
            color="primary"
            :label="t('actions.save')"
            @click="onOKClick"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { reactive, ref, toRaw } from 'vue';
import { Room } from 'src/types/Room';

interface Props {
  room?: Room;
  mode: 'create' | 'edit';
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
const capacity = ref<number>(room.roomMates.length);

function defaultRoom(): Room {
  return props.room
    ? structuredClone(toRaw(props.room))
    : {
        name: '',
        roomMates: [],
      };
}

function onOKClick(): void {
  const diff = capacity.value - room.roomMates.length;
  if (diff > 0) {
    // Add elements
    room.roomMates.push(...Array(diff).fill(null));
  } else if (diff < 0) {
    // Remove n elements
    room.roomMates.splice(diff);
  }

  onDialogOK(room);
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
