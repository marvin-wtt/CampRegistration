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
          {{ t('option.edit') }}
        </q-item-section>
      </q-item>
      <q-item
        v-if="waitingList"
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
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import { Registration } from 'src/types/Registration';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import { useRegistrationsStore } from 'stores/registration-store';

const props = defineProps<TableCellProps>();
const quasar = useQuasar();
const { t } = useI18n();
const campDetailStore = useCampDetailsStore();
const registrationStore = useRegistrationsStore();
const camp = storeToRefs(campDetailStore);
const registrationHelper = useRegistrationHelper();

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});

const registration = computed<Registration>(() => {
  return props.props.row as Registration;
});

const waitingList = computed<boolean>(() => {
  return registrationHelper.waitingList(registration.value);
});

function deleteItem(): void {
  const value = registrationHelper.fullName(registration.value);

  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message'),
        label: t('dialog.delete.label'),
        value: value,
      },
    })
    .onOk(async () => {
      const id = registration.value.id;
      await registrationStore.deleteData(id);
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
      result: registration.value.data,
    },
  });
}
</script>

<i18n lang="yaml" locale="em">
option:
  edit: 'Edit'
  delete: 'Delete'
  accept: 'Accept registration'

dialog:
  delete:
    title: 'Delete registration'
    message: 'Once you delete the registration, all data about this person is lost.'
    label: 'Name'
</i18n>

<i18n lang="yaml" locale="de">
option:
  edit: 'Bearbeiten'
  delete: 'Löschen'
  accept: 'Anmeldung akzeptieren'

dialog:
  delete:
    title: 'Registrierung löschen'
    message: 'Wenn Sie die Registrierung löschen, gehen alle Daten dieser Person verloren.'
    label: 'Name'
</i18n>

<i18n lang="yaml" locale="fr">
option:
  edit: 'Modifier'
  delete: 'Supprimer'
  accept: "Accepter l'inscription"

dialog:
  delete:
    title: "Supprimer l'inscription"
    message: "Une fois que vous supprimez l'inscription, toutes les données concernant cette personne sont perdues."
    label: 'Nom'
</i18n>

<style scoped></style>
