<template>
  <q-btn
    v-if="!props.printing"
    :size="size"
    dense
    field="edit"
    flat
    icon="more_vert"
    round
  >
    <q-menu>
      <q-item
        v-close-popup
        clickable
        @click="editItem"
      >
        <q-item-section>
          {{ t('edit') }}
        </q-item-section>
      </q-item>
      <q-item
        v-if="waitingList"
        v-close-popup
        clickable
        @click="accept"
      >
        <q-item-section>
          {{ t('accept') }}
        </q-item-section>
      </q-item>
      <q-separator />
      <q-item
        v-close-popup
        class="text-negative"
        clickable
        @click="deleteItem"
      >
        <q-item-section>
          {{ t('delete') }}
        </q-item-section>
      </q-item>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import EditResultComponent from 'components/campManagement/table/dialogs/EditResultComponent.vue';

import { useCampDetailsStore } from 'stores/camp-details-store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import ConfirmDeleteDialog from 'components/campManagement/table/dialogs/ConfirmDeleteRegistrationDialog.vue';
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();
const quasar = useQuasar();
const { t } = useI18n();
const campDetailStore = useCampDetailsStore();
const camp = storeToRefs(campDetailStore);

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});

const waitingList = computed<boolean>(() => {
  const key = props.settings?.waitingListKey ?? 'waiting_list';
  return props.props.row[key] == true;
});

function deleteItem(): void {
  quasar.dialog({
    component: ConfirmDeleteDialog,
    componentProps: {
      result: props.props.row,
    },
  });
}

function accept(): void {
  // TODO
  quasar.dialog({});
}

function editItem(): void {
  quasar.dialog({
    component: EditResultComponent,
    componentProps: {
      questions: camp.data.value?.form,
      result: props.props.row,
    },
  });
}
</script>

<!-- TODO Add translations -->
<i18n lang="yaml">
en:
  edit: 'Edit'
  delete: 'Delete'
  accept: 'Accept registration'

de:
  edit: 'Bearbeiten'
  delete: 'Löschen'
  accept: 'Anmeldung akzeptieren'

fr:
  edit: 'Modifier'
  delete: 'Supprimer'
  accept: "Accepter l'inscription"
</i18n>

<style scoped></style>
