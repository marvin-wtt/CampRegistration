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
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import { useI18n } from 'vue-i18n';
import EditResultComponent from 'components/results/table/dialogs/EditResultComponent.vue';

import { useCampDetailsStore } from 'stores/camp/camp-details-store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import ConfirmDeleteDialog from 'components/results/table/dialogs/ConfirmDeleteRegistrationDialog.vue';

interface Props {
  props: QTableBodyCellProps;
  options?: object;
  printing: boolean;
}

const props = defineProps<Props>();

const quasar = useQuasar();
const { t } = useI18n();

const campDetailStore = useCampDetailsStore();
const camp = storeToRefs(campDetailStore);

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});

function deleteItem(): void {
  quasar.dialog({
    component: ConfirmDeleteDialog,
    componentProps: {
      result: props.props.row,
    },
  });
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

<i18n>
{
  "en": {
    "edit": "Edit",
    "delete": "Delete"
  },
  "de": {
    "edit": "Bearbeiten",
    "delete": "Löschen"
  },
  "fr": {
    "edit": "Modifier",
    "delete": "Supprimer"
  }
}
</i18n>

<style scoped></style>
