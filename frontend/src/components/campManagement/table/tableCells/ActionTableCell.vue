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
import type { Registration } from '@camp-registration/common/entities';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import { useRegistrationsStore } from 'stores/registration-store';
import { usePermissions } from 'src/composables/permissions';

const { props: cellProps, printing, readonly } = defineProps<TableCellProps>();
const quasar = useQuasar();
const { t } = useI18n();
const campDetailStore = useCampDetailsStore();
const registrationStore = useRegistrationsStore();
const camp = storeToRefs(campDetailStore);
const registrationHelper = useRegistrationHelper();
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
      const id = cellProps.row.id;
      await registrationStore.deleteData(id);
    });
}

function accept(): void {
  quasar
    .dialog({
      title: t('dialog.accept.title'),
      message: t('dialog.accept.message'),
      ok: {
        label: t('dialog.accept.action.ok'),
        rounded: true,
        color: 'primary',
      },
      cancel: {
        label: t('dialog.accept.action.cancel'),
        outline: true,
        rounded: true,
        color: 'primary',
      },
    })
    .onOk(async () => {
      const id = cellProps.row.id;
      await registrationStore.updateData(id, {
        waitingList: false,
      });
    });
}

function editItem(): void {
  quasar
    .dialog({
      component: EditResultComponent,
      componentProps: {
        camp: camp.data.value,
        data: cellProps.row.data,
        uploadFileFn: uploadFile,
      },
    })
    .onOk((payload) => {
      const id = cellProps.row.id;
      registrationStore.updateData(id, { data: payload });
    });
}

async function uploadFile(file: File): Promise<string> {
  const serviceFile = await registrationStore.storeFile(file);

  if (serviceFile.field) {
    return `${serviceFile.id}#${serviceFile.field}`;
  }

  return serviceFile.id;
}
</script>

<i18n lang="yaml" locale="en">
option:
  details: 'Show details'
  edit: 'Edit'
  delete: 'Delete'
  accept: 'Accept registration'

dialog:
  accept:
    title: 'Accept registration'
    message: 'Accept registration from waiting list. The participant will revive the confirmation email.'
    action:
      ok: 'Accept'
      cancel: 'Cancel'
  delete:
    title: 'Delete registration'
    message: 'Once you delete the registration, all data about this person is lost.'
    label: 'Name'
</i18n>

<i18n lang="yaml" locale="de">
option:
  details: 'Details anzeigen'
  edit: 'Bearbeiten'
  delete: 'Löschen'
  accept: 'Anmeldung akzeptieren'

dialog:
  accept:
    title: 'Registrierung akzeptieren'
    message: 'Anmeldung aus der Warteliste akzeptieren. Der Teilnehmer erhält eine Bestätigungs-E-Mail.'
    action:
      ok: 'Akzeptieren'
      cancel: 'Abbrechen'
  delete:
    title: 'Registrierung löschen'
    message: 'Wenn Sie die Registrierung löschen, gehen alle Daten dieser Person verloren.'
    label: 'Name'
</i18n>

<i18n lang="yaml" locale="fr">
option:
  details: 'Voir détails'
  edit: 'Modifier'
  delete: 'Supprimer'
  accept: "Accepter l'inscription"

dialog:
  accept:
    title: "Accepter l'inscription"
    message: "Accepter l'inscription de la liste d'attente. Le participant recevra un courriel de confirmation."
    action:
      ok: 'Accepter'
      cancel: 'Annuler'
  delete:
    title: "Supprimer l'inscription"
    message: "Une fois que vous supprimez l'inscription, toutes les données concernant cette personne sont perdues."
    label: 'Nom'
</i18n>

<style scoped></style>
