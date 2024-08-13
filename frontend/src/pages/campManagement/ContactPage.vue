<template>
  <page-state-handler
    :error="error"
    :loading="loading"
    padding
    class="column q-gutter-sm"
  >
    <contact-select
      v-model="to"
      :label="t('to')"
      :registrations
      :managers="[]"
      outlined
      rounded
      dense
    />
    <q-input
      v-model="replyTo"
      :label="t('replyTo')"
      outlined
      rounded
      dense
    />
    <q-input
      v-model="subject"
      :label="t('subject')"
      :maxlength="988"
      autogrow
      outlined
      rounded
      dense
    />
    <!-- TODO Attachments -->
    <!-- TODO Priority -->

    <email-editor
      v-model="text"
      class="col-grow"
    />

    <q-btn
      :label="t('send')"
      icon="send"
      color="primary"
      rounded
      class="q-mt-sm self-end"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useRegistrationsStore } from 'stores/registration-store';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ContactSelect from 'components/campManagement/contact/ContactSelect.vue';
import { Registration } from '@camp-registration/common/entities';
import EmailEditor from 'components/campManagement/contact/EmailEditor.vue';
import { Contact } from 'components/campManagement/contact/Contact';
import { useRegistrationHelper } from 'src/composables/registrationHelper';

const { t } = useI18n();
const { emails } = useRegistrationHelper();

const registrationStore = useRegistrationsStore();

registrationStore.fetchData();

const to = ref<Contact[]>([]);
const replyTo = ref<string>();
const subject = ref<string>();
const attachments = ref<File[]>();
const prioroty = ref<'high' | 'low'>();

const text = ref<string>('');

const error = computed<string | null>(() => {
  return registrationStore.error;
});

const loading = computed<boolean>(() => {
  return registrationStore.isLoading;
});

const registrations = computed<Registration[]>(() => {
  return registrationStore.data ?? [];
});

function send() {
  const addresses = to.value?.flatMap(contactToEmails);

  // TODO Process text
}

function contactToEmails(contact: Contact): string[] {
  switch (contact.type) {
    case 'group':
      return contact.registrations.flatMap(emails);
    case 'participant':
    case 'counselor':
      return emails(contact.registration);
    case 'external':
    case 'manager':
      return [contact.email];
  }
}

// TODO i18n
// - remove
</script>

<style scoped></style>
