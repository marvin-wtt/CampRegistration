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
      <q-card :class="cardStyleClass">
        <q-card-section class="q-gutter-sm">
          <div class="text-h5">
            {{ t('title') }}
          </div>
          <div class="text-caption">
            {{ t('caption') }}
          </div>

          <q-input
            v-model="message"
            :label="t('message.label')"
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
            :label="t('action.send')"
            color="primary"
            rounded
            @click="send"
          />
        </q-card-actions>
      </q-card>
    </q-fab>

    <q-dialog
      v-model="dialogOpen"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="column">
        <q-bar class="bg-primary text-white">
          <a> {{ t('dialog.title') }} </a>

          <q-space />

          <q-btn
            v-close-popup
            dense
            flat
            rounded
            icon="close"
            @click="open = false"
          >
            <q-tooltip class="bg-white text-primary">
              {{ t('dialog.close') }}
            </q-tooltip>
          </q-btn>
        </q-bar>

        <div class="col-grow column justify-between">
          <q-card-section class="q-gutter-md">
            <div class="text-h5">
              {{ t('title') }}
            </div>
            <div class="text-caption">
              {{ t('caption') }}
            </div>

            <q-input
              v-model="message"
              :label="t('message.label')"
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

          <q-card-actions class="q-pb-lg">
            <q-btn
              class="full-width"
              icon="send"
              :label="t('action.send')"
              color="primary"
              rounded
              @click="send"
            />
          </q-card-actions>
        </div>
      </q-card>
    </q-dialog>
  </q-page-sticky>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { useAPIService } from 'src/services/APIService';
import { useQuasar } from 'quasar';

const quasar = useQuasar();
const { t } = useI18n();
const api = useAPIService();

const open = ref<boolean>(false);
const message = ref<string>();
const email = ref<string>();

const cardStyleClass = computed<string>(() => {
  return quasar.screen.lt.sm ? 'card-mobile' : 'card-desktop';
});

const dialogOpen = computed<boolean>(() => {
  return (open.value && quasar.screen.lt.sm) ?? false;
});

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

<style scoped>
.card-mobile {
  width: calc(100vw - 40px);
}

.card-desktop {
  width: 400px;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Send us feedback!'
caption: "We'd love to hear from you. Please type your feedback or suggestions here."

message:
  label: 'Your feedback'

email:
  label: 'Email'
  hint: 'Optional'

action:
  send: 'Send'

dialog:
  title: 'Feedback'
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Schick uns Feedback!'
caption: 'Wir freuen uns über deine Meinung. Schreib uns hier dein Feedback oder deine Vorschläge.'

message:
  label: 'Dein Feedback'

email:
  label: 'E-Mail'
  hint: 'Optional'

action:
  send: 'Senden'

dialog:
  title: 'Feedback'
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Envoyez-nous tes retours !'
caption: 'On aimerait bien avoir de tes nouvelles. Écris-nous ici ton avis ou tes suggestions.'

message:
  label: 'Tes retours'

email:
  label: 'E-mail'
  hint: 'Facultatif'

action:
  send: 'Envoyer'

dialog:
  title: 'Réaction'
  close: 'Fermez'
</i18n>
