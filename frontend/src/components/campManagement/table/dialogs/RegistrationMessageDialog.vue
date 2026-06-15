<template>
  <q-dialog
    ref="dialogRef"
    :maximized="quasar.screen.lt.sm"
    :full-height="quasar.screen.lt.sm"
    :full-width="quasar.screen.lt.sm"
    @hide="onDialogHide"
  >
    <q-card class="column message-dialog-card">
      <q-bar class="col-shrink">
        {{ t('title') }}

        <q-space />

        <q-btn
          v-close-popup
          icon="close"
          flat
          dense
          @click="onDialogCancel"
        >
          <q-tooltip>
            {{ t('action.close') }}
          </q-tooltip>
        </q-btn>
      </q-bar>

      <contact-form
        class="col"
        :registrations
        :initial-contacts="initialContacts"
        @sent="onDialogOK"
      />
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import type { Registration } from '@camp-registration/common/entities';
import type { Contact } from 'components/campManagement/contact/Contact';
import ContactForm from 'components/campManagement/contact/ContactForm.vue';
import { useRegistrationsStore } from 'stores/registration-store';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import { formatPersonName } from 'src/utils/formatters';

const quasar = useQuasar();
const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { registration } = defineProps<{
  registration: Registration;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const registrationStore = useRegistrationsStore();
const { fullName, role } = useRegistrationHelper();

const registrations = computed<Registration[]>(() => {
  return registrationStore.data ?? [registration];
});

const initialContacts = computed<Contact[]>(() => [
  {
    type: contactType(registration),
    name: formatPersonName(fullName(registration)),
    registration,
  },
]);

function contactType(reg: Registration): Exclude<Contact['type'], 'group'> {
  if (reg.status === 'WAITLISTED') {
    return 'waitingList';
  }
  return role(reg) === 'participant' ? 'participant' : 'counselor';
}
</script>

<style scoped>
.message-dialog-card {
  width: min(800px, 95vw);
  max-width: 95vw;
  height: min(800px, 90vh);
  overflow: hidden;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Send message'
action:
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Nachricht senden'
action:
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Envoyer un message'
action:
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wyślij wiadomość'
action:
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Odeslat zprávu'
action:
  close: 'Zavřít'
</i18n>
