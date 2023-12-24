<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-card-section>
        <div class="text-h6">
          {{ t('title') }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <sortable-list
          v-slot="slotProps"
          v-model="modifiedRooms"
          bordered
          separator
        >
          <q-item-section>
            {{ to(slotProps.item.name) }}
          </q-item-section>
        </sortable-list>
      </q-card-section>

      <!-- buttons example -->
      <q-card-actions align="right">
        <q-btn
          color="primary"
          :label="t('actions.cancel')"
          outline
          rounded
          @click="onDialogCancel"
        />
        <q-btn
          color="primary"
          :label="t('actions.ok')"
          rounded
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import SortableList from 'components/common/SortableList.vue';
import { reactive, toRaw } from 'vue';
import { RoomWithRoommates } from 'src/types/Room';

interface Props {
  rooms: RoomWithRoommates[];
}

const props = defineProps<Props>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { to } = useObjectTranslation();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const modifiedRooms = reactive<RoomWithRoommates[]>(propRooms());

function propRooms(): RoomWithRoommates[] {
  const rooms = props.rooms.map((room) => {
    return toRaw(room);
  });
  return structuredClone(rooms) as RoomWithRoommates[];
}

function onOKClick() {
  onDialogOK(modifiedRooms);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Edit Rooms'

actions:
  ok: 'Ok'
  cancel: 'Cancel'

defaults:
  title: 'New template'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zimmer bearbeiten'

actions:
  ok: 'Ok'
  cancel: 'Abbrechen'

defaults:
  title: 'Neue Vorlage'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier les pièces'

actions:
  ok: 'Ok'
  cancel: 'Annuler'

defaults:
  title: 'Nouveau modèle'
</i18n>
