<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-card-section class="text-h6">
        {{ t('title') }}
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
          :label="t('action.cancel')"
          outline
          rounded
          @click="onDialogCancel"
        />
        <q-btn
          color="primary"
          :label="t('action.ok')"
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
import { onBeforeUpdate, ref } from 'vue';
import type { RoomWithRoommates } from 'src/types/Room';
import { deepToRaw } from 'src/utils/deepToRaw';

const { rooms } = defineProps<{
  rooms: RoomWithRoommates[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { to } = useObjectTranslation();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const modifiedRooms = ref<RoomWithRoommates[]>(defaultRooms());

onBeforeUpdate(() => {
  modifiedRooms.value = defaultRooms();
});

function defaultRooms(): RoomWithRoommates[] {
  return structuredClone(deepToRaw(rooms));
}

function onOKClick() {
  onDialogOK(modifiedRooms.value);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Edit Rooms'

action:
  ok: 'Ok'
  cancel: 'Cancel'

default:
  title: 'New template'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zimmer bearbeiten'

action:
  ok: 'Ok'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier les pièces'

action:
  ok: 'Ok'
  cancel: 'Annuler'
</i18n>
