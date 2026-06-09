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
        @click="showDetails"
      >
        <q-item-section>
          {{ t('option.details') }}
        </q-item-section>
      </q-item>

      <q-item
        v-if="can('camp.messages.create')"
        v-close-popup
        :disable="!hasEmail"
        clickable
        @click="sendMessage"
      >
        <q-item-section>
          {{ t('option.sendMessage') }}
        </q-item-section>
        <q-tooltip v-if="!hasEmail">
          {{ t('option.sendMessageDisabled') }}
        </q-tooltip>
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
        v-if="!accepted && !readonly && can('camp.registrations.edit')"
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
import RegistrationEditor from 'components/campManagement/table/dialogs/RegistrationEditor.vue';

import { useCampDetailsStore } from 'stores/camp-details-store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import type {
  MessageTemplate,
  Registration,
  RegistrationDeleteQuery,
  RegistrationUpdateQuery,
} from '@camp-registration/common/entities';
import { useRegistrationsStore } from 'stores/registration-store';
import { usePermissions } from 'src/composables/permissions';
import RegistrationDeleteDialog from 'components/campManagement/table/dialogs/RegistrationDeleteDialog.vue';
import RegistrationAcceptDialog from 'components/campManagement/table/dialogs/RegistrationAcceptDialog.vue';
import RegistrationDetailsDialog from 'components/campManagement/table/dialogs/RegistrationDetailsDialog.vue';
import RegistrationMessageDialog from 'components/campManagement/table/dialogs/RegistrationMessageDialog.vue';
import { useAPIService } from 'src/services/APIService';
import { useMessageTemplateService } from 'src/services/MessageTemplateService';

const { props: cellProps, printing, readonly } = defineProps<TableCellProps>();
const quasar = useQuasar();
const { t } = useI18n();
const apiService = useAPIService();
const campDetailStore = useCampDetailsStore();
const registrationStore = useRegistrationsStore();
const messageTemplateService = useMessageTemplateService();
const { data: campData } = storeToRefs(campDetailStore);
const { can } = usePermissions();

const size = computed<string>(() => {
  return cellProps.dense ? 'xs' : 'md';
});

const registration = computed<Registration>(() => {
  return cellProps.row;
});

const accepted = computed<boolean>(() => {
  return cellProps.row.status === 'ACCEPTED';
});

const hasEmail = computed<boolean>(() => {
  return !!registration.value.computedData.emails?.length;
});

let templatesFetch: Promise<MessageTemplate[]> | null = null;

function ensureTemplates(): Promise<MessageTemplate[]> {
  templatesFetch ??= messageTemplateService
    .fetchMessageTemplates(campData.value.id)
    .catch(() => []);

  return templatesFetch;
}

function hasTemplateForEvent(
  allTemplates: MessageTemplate[],
  eventName: string,
): boolean {
  const country = registration.value.computedData.address.country ?? null;

  return allTemplates
    .filter((tmpl) => tmpl.event === eventName)
    .some(
      (tmpl) =>
        country === null || tmpl.country === null || tmpl.country === country,
    );
}

function showDetails(): void {
  quasar.dialog({
    component: RegistrationDetailsDialog,
    componentProps: {
      registration: registration.value,
    },
  });
}

function sendMessage(): void {
  quasar.dialog({
    component: RegistrationMessageDialog,
    componentProps: {
      registration: registration.value,
    },
  });
}

async function deleteItem(): Promise<void> {
  const allTemplates = await ensureTemplates();
  const hasTemplate = hasTemplateForEvent(
    allTemplates,
    'registration_canceled',
  );

  quasar
    .dialog({
      component: RegistrationDeleteDialog,
      componentProps: {
        registration: registration.value,
        hasTemplate,
      },
    })
    .onOk((params: RegistrationDeleteQuery) => {
      const id = cellProps.row.id;
      void registrationStore.deleteData(id, params);
    });
}

async function accept(): Promise<void> {
  const allTemplates = await ensureTemplates();
  const event =
    registration.value.status === 'WAITLISTED'
      ? 'registration_waitlist_accepted'
      : 'registration_confirmed';
  const hasTemplate = hasTemplateForEvent(allTemplates, event);

  quasar
    .dialog({
      component: RegistrationAcceptDialog,
      componentProps: {
        registration: registration.value,
        hasTemplate,
      },
    })
    .onOk((params: RegistrationUpdateQuery) => {
      const id = cellProps.row.id;
      void registrationStore.updateData(id, { status: 'ACCEPTED' }, params);
    });
}

interface EditCallbackData {
  data: Record<string, unknown>;
  suppressMessage: boolean;
}

async function editItem(): Promise<void> {
  const allTemplates = await ensureTemplates();
  const hasTemplate = hasTemplateForEvent(allTemplates, 'registration_updated');

  quasar
    .dialog({
      component: RegistrationEditor,
      componentProps: {
        camp: campData.value,
        data: cellProps.row.data,
        uploadFileFn: uploadFile,
        hasTemplate,
      },
    })
    .onOk(({ data, suppressMessage }: EditCallbackData) => {
      const id = cellProps.row.id;
      void registrationStore.updateData(id, { data }, { suppressMessage });
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
  sendMessage: 'Send message'
  sendMessageDisabled: 'No email address available'
  edit: 'Edit'
  delete: 'Delete'
  accept: 'Accept registration'
</i18n>

<i18n lang="yaml" locale="de">
option:
  details: 'Details anzeigen'
  sendMessage: 'Nachricht senden'
  sendMessageDisabled: 'Keine E-Mail-Adresse verfügbar'
  edit: 'Bearbeiten'
  delete: 'Löschen'
  accept: 'Anmeldung akzeptieren'
</i18n>

<i18n lang="yaml" locale="fr">
option:
  details: 'Voir détails'
  sendMessage: 'Envoyer un message'
  sendMessageDisabled: 'Aucune adresse e-mail disponible'
  edit: 'Modifier'
  delete: 'Supprimer'
  accept: "Accepter l'inscription"
</i18n>

<i18n lang="yaml" locale="pl">
option:
  details: 'Pokaż szczegóły'
  sendMessage: 'Wyślij wiadomość'
  sendMessageDisabled: 'Brak dostępnego adresu e-mail'
  edit: 'Edytuj'
  delete: 'Usuń'
  accept: 'Akceptuj zgłoszenie'
</i18n>

<i18n lang="yaml" locale="cs">
option:
  details: 'Zobrazit podrobnosti'
  sendMessage: 'Odeslat zprávu'
  sendMessageDisabled: 'Není k dispozici žádná e-mailová adresa'
  edit: 'Upravit'
  delete: 'Smazat'
  accept: 'Přijmout registraci'
</i18n>

<style scoped></style>
