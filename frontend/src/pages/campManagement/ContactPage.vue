<template>
  <page-state-handler
    :error="error"
    :loading="loading"
    padding
    class="column q-gutter-sm"
  >
    <contact-select
      v-model="to"
      :label="t('input.to')"
      :registrations
      outlined
      rounded
      dense
    />
    <div class="row">
      <q-input
        v-model="replyTo"
        :label="t('input.replyTo')"
        class="col-grow"
        outlined
        rounded
        dense
      />

      <q-select
        v-model="priority"
        :label="t('input.priority')"
        :options="priorityOptions"
        emit-value
        map-options
        outlined
        rounded
        dense
        style="min-width: 100px"
      />
    </div>
    <q-input
      v-model="subject"
      :label="t('input.subject')"
      :maxlength="988"
      autogrow
      outlined
      rounded
      dense
    />

    <q-file
      v-model="attachments"
      :label="t('input.attachments')"
      max-total-size="20000000"
      multiple
      append
      use-chips
      outlined
      rounded
      dense
    />

    <email-editor
      v-model="text"
      :tokens
      class="col-grow"
    />

    <q-btn
      :label="t('send')"
      icon="send"
      color="primary"
      rounded
      class="q-mt-sm self-end"
      @click="send"
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
import { Token } from 'components/campManagement/contact/Token';
import { QSelectOption } from 'quasar';

const { t } = useI18n();

const registrationStore = useRegistrationsStore();

registrationStore.fetchData();

const to = ref<Contact[]>([]);
const replyTo = ref<string>();
const subject = ref<string>();
const attachments = ref<File[]>();
const priority = ref<'high' | 'normal' | 'low'>('normal');

const text = ref<string>('This is a test');

const tokens = computed<Token[]>(() => [
  {
    key: 'camp',
    label: t('token.camp'),
    items: [
      {
        label: 'Test',
        value: 'test',
      },
    ],
  },
]);

const priorityOptions = computed<QSelectOption[]>(() => [
  {
    label: t('priority.low'),
    value: 'low',
  },
  {
    label: t('priority.normal'),
    value: 'normal',
  },
  {
    label: t('priority.high'),
    value: 'high',
  },
]);

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
  // TODO
}

// TODO i18n
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
input:
  attachments: 'Attachments:'
  priority: 'Priority:'
  replyTo: 'Reply To:'
  subject: 'Subject:'
  to: 'To:'

priority:
  high: 'High'
  low: 'Low'
  normal: 'Normal'
</i18n>
