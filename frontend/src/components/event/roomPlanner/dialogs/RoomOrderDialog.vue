<template>
  <responsive-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :width="480"
      @submit="onOKClick"
      @cancel="onDialogCancel"
    >
      <sortable-list
        v-slot="slotProps"
        v-model="modifiedRooms"
        sortable
        bordered
        separator
      >
        <q-item-section>
          {{ to(slotProps.item.name) }}
        </q-item-section>
      </sortable-list>

      <template #actions>
        <q-btn
          type="reset"
          color="primary"
          :label="t('action.cancel')"
          outline
          rounded
        />
        <q-btn
          type="submit"
          color="primary"
          :label="t('action.ok')"
          rounded
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from '@/composables/objectTranslation';
import SortableList from '@/components/common/SortableList.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import { onBeforeUpdate, ref } from 'vue';
import type { RoomWithRoommates } from '@/types/Room';
import { deepToRaw } from '@/utils/deepToRaw';

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

<i18n lang="yaml" locale="pl">
title: 'Edytuj pokój'

action:
  ok: 'OK'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Upravit pokoj'

action:
  ok: 'OK'
  cancel: 'Zrušit'
</i18n>
