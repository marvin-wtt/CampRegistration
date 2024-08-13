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
      v-model="cc"
      :label="t('cc')"
      outlined
      rounded
      dense
    />
    <q-input
      v-model="bcc"
      :label="t('bcc')"
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

const { t } = useI18n();
const registrationStore = useRegistrationsStore();

registrationStore.fetchData();

const to = ref<string>();
const cc = ref<string>();
const bcc = ref<string>();
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

// TODO i18n
// - remove
</script>

<style scoped></style>
