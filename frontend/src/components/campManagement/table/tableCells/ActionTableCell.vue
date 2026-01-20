<template>
  <q-btn
    v-if="!printing"
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
        disable
      >
        <q-item-section>
          {{ t('option.details') }}
        </q-item-section>
      </q-item>

      <q-item
        v-if="!readonly && can('camp.registrations.edit')"
        v-close-popup
        clickable
        @click="editItem"
      >
        <q-item-section>
          {{ t('option.edit') }}
        </q-item-section>
      </q-item>
      <q-item
        v-if="waitingList && !readonly && can('camp.registrations.edit')"
        v-close-popup
        clickable
        @click="accept"
      >
        <q-item-section>
          {{ t('option.accept') }}
        </q-item-section>
      </q-item>
      <q-separator />
      <q-item
        v-if="!readonly && can('camp.registrations.delete')"
        v-close-popup
        class="text-negative"
        clickable
        @click="deleteItem"
      >
        <q-item-section>
          {{ t('option.delete') }}
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
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import type {
  Registration,
  RegistrationDeleteQuery,
  RegistrationUpdateQuery,
} from '@camp-registration/common/entities';
import { useRegistrationsStore } from 'stores/registration-store';
import { usePermissions } from 'src/composables/permissions';
import RegistrationDeleteDialog from 'components/campManagement/table/dialogs/RegistrationDeleteDialog.vue';
import RegistrationAcceptDialog from 'components/campManagement/table/dialogs/RegistrationAcceptDialog.vue';
import { useAPIService } from 'src/services/APIService';

const { props: cellProps, printing, readonly } = defineProps<TableCellProps>();
const quasar = useQuasar();
const { t } = useI18n();
const apiService = useAPIService();
const campDetailStore = useCampDetailsStore();
const registrationStore = useRegistrationsStore();
const { data: campData } = storeToRefs(campDetailStore);
const { can } = usePermissions();

const size = computed<string>(() => {
  return cellProps.dense ? 'xs' : 'md';
});

const registration = computed<Registration>(() => {
  return cellProps.row;
});

const waitingList = computed<boolean>(() => {
  return cellProps.row.waitingList;
});

function deleteItem(): void {
  quasar
    .dialog({
      component: RegistrationDeleteDialog,
      componentProps: {
        registration: registration.value,
        camp: campData.value,
      },
    })
    .onOk((params: RegistrationDeleteQuery) => {
      const id = cellProps.row.id;
      void registrationStore.deleteData(id, params);
    });
}

function accept(): void {
  quasar
    .dialog({
      component: RegistrationAcceptDialog,
      componentProps: {
        registration: registration.value,
        camp: campData.value,
      },
    })
    .onOk((params: RegistrationUpdateQuery) => {
      const id = cellProps.row.id;
      void registrationStore.updateData(
        id,
        {
          waitingList: false,
        },
        params,
      );
    });
}

function editItem(): void {
  quasar
    .dialog({
      component: EditResultComponent,
      componentProps: {
        camp: campData.value,
        data: cellProps.row.data,
        uploadFileFn: uploadFile,
      },
    })
    .onOk((payload) => {
      const id = cellProps.row.id;
      void registrationStore.updateData(id, { data: payload });
    });
}

async function uploadFile(file: File): Promise<string> {
  const serviceFile = await apiService.createTemporaryFile({ file });

  return serviceFile.id;
}
</script>

<i18n lang="yaml" locale="en">
option:
  details: 'Show details'
  edit: 'Edit'
  delete: 'Delete'
  accept: 'Accept registration'
</i18n>

<i18n lang="yaml" locale="de">
option:
  details: 'Details anzeigen'
  edit: 'Bearbeiten'
  delete: 'Löschen'
  accept: 'Anmeldung akzeptieren'
</i18n>

<i18n lang="yaml" locale="fr">
option:
  details: 'Voir détails'
  edit: 'Modifier'
  delete: 'Supprimer'
  accept: "Accepter l'inscription"
</i18n>

<i18n lang="yaml" locale="pl">
option:
  details: 'Pokaż szczegóły'
  edit: 'Edytuj'
  delete: 'Usuń'
  accept: 'Akceptuj zgłoszenie'
</i18n>

<i18n lang="yaml" locale="cs">
option:
  details: 'Zobrazit podrobnosti'
  edit: 'Upravit'
  delete: 'Smazat'
  accept: 'Přijmout registraci'
</i18n>

<style scoped></style>
