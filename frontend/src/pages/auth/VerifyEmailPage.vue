<template>
  <q-page
    class="row justify-center"
    :class="quasar.screen.gt.xs ? 'content-center' : ''"
  >
    <q-card
      class="q-pa-md col-xs-12 col-sm-8 col-md-5 col-lg-3"
      :flat="quasar.screen.lt.sm"
    >
      <q-form
        class="fit column justify-center no-wrap"
        @submit="sendVerificationEmail"
      >
        <q-card-section class="text-h4 text-bold text-center">
          {{ t('title') }}
        </q-card-section>

        <!-- Description -->
        <q-card-section>
          <p class="text-subtitle1 text-center">
            {{ t('description') }}
          </p>
        </q-card-section>

        <q-card-section class="row justify-center">
          <q-avatar
            icon="verified_user"
            color="primary"
            text-color="white"
            size="100px"
          />
        </q-card-section>

        <q-card-actions class="q-ma-md">
          <q-btn
            :label="
              countdown > 0
                ? t('action.resendIn', { time: countdown })
                : t('action.resend')
            "
            type="submit"
            :loading
            :disabled="countdown > 0"
            color="primary"
            size="lg"
            class="full-width"
            rounded
          />
        </q-card-actions>

        <q-card-section
          v-if="error"
          class="text-negative text-center text-bold"
        >
          {{ error }}
        </q-card-section>
      </q-form>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

const quasar = useQuasar();
const { t } = useI18n();

const authStore = useAuthStore();
const { loading, error } = storeToRefs(authStore);

authStore.reset();

const DEFAULT_COUNTDOWN_SECONDS = 30;
const countdown = ref<number>(DEFAULT_COUNTDOWN_SECONDS);
let intervalId: number | undefined;

onMounted(() => {
  startCountdown();
});

function startCountdown() {
  // Clear any existing interval to avoid duplicates
  if (intervalId) {
    clearInterval(intervalId);
  }

  countdown.value = DEFAULT_COUNTDOWN_SECONDS;
  intervalId = window.setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(intervalId);
    }
  }, 1000);
}

function sendVerificationEmail() {
  // TODO

  startCountdown();
}
</script>

<i18n lang="yaml" locale="en">
title: 'Verify your email'
description: 'We have sent a verification email to your email address. Please click on the link in the email to verify your account.'
action:
  resend: 'Resend'
  resendIn: 'Resend in {time}s'
</i18n>

<i18n lang="yaml" locale="de">
title: 'E-Mail bestätigen'
description: 'Wir haben eine Bestätigungs-E-Mail an Ihre Adresse gesendet. Bitte klicken Sie auf den Link, um Ihr Konto zu verifizieren.'
action:
  resend: 'Erneut senden'
  resendIn: 'Erneut senden in {time}s'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Vérifiez votre adresse e-mail'
description: 'Nous vous avons envoyé un e-mail de vérification à votre adresse. Veuillez cliquer sur le lien pour vérifier votre compte.'
action:
  resend: 'Renvoyer'
  resendIn: 'Renvoyer dans {time}s'
</i18n>
