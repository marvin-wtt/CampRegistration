<template>
  <q-page-sticky
    position="bottom-right"
    :offset="[18, 18]"
  >
    <q-fab
      v-model="open"
      color="primary"
      icon="contact_support"
      direction="up"
      vertical-actions-align="right"
    >
      <q-card style="width: 300px">
        <q-card-section class="q-gutter-sm">
          <div class="text-h5">
            {{ t('title') }}
          </div>
          <div class="text-caption">
            {{ t('caption') }}
          </div>

          <q-input
            :label="t('message.label')"
            v-model="message"
            type="textarea"
            outlined
            rounded
          />

          <q-input
            v-model="email"
            :label="t('email.label')"
            :hint="t('email.hint')"
            outlined
            rounded
          />
        </q-card-section>

        <q-card-actions>
          <q-btn
            class="full-width"
            icon="send"
            :label="t('send')"
            color="primary"
            rounded
            @click="send"
          />
        </q-card-actions>
      </q-card>
    </q-fab>
  </q-page-sticky>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import { useAPIService } from 'src/services/APIService';

const api = useAPIService();

const { t } = useI18n();

const open = ref<boolean>(false);
const message = ref<string>();
const email = ref<string>();

function send() {
  if (message.value) {
    const location = window.location.href;

    api.sendFeedback(location, message.value, email.value);
  }

  clear();
}

function clear() {
  message.value = undefined;
  email.value = undefined;
  open.value = false;
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Send us feedback!'
caption: "We'd love to hear from you. Please type your feedback or suggestions here."

message:
  label: 'Your feedback'

email:
  label: 'Email'
  hint: 'Optional'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Schick uns Feedback!'
caption: 'Wir freuen uns über deine Meinung. Schreib uns hier dein Feedback oder deine Vorschläge.'

message:
  label: 'Dein Feedback'

email:
  label: 'E-Mail'
  hint: 'Optional'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Envoyez-nous vos retours !'
caption: 'On aimerait bien avoir de tes nouvelles. Écris-nous ici ton avis ou tes suggestions.'

message:
  label: 'Tes retours'

email:
  label: 'E-mail'
  hint: 'Facultatif'
</i18n>
