<template>
  <q-page class="row justify-center content-center">
    <q-card
      class="auth-card col-xs-12 col-sm-8 col-md-6 col-lg-4"
      :flat="quasar.screen.lt.sm"
    >
      <div class="auth-card-header">
        <q-avatar
          icon="mark_email_unread"
          color="white"
          text-color="primary"
          size="64px"
          class="auth-card-avatar"
        />
      </div>

      <q-form
        class="column no-wrap"
        @submit="sendVerificationEmail"
      >
        <q-card-section
          class="text-h5 text-weight-bold text-center q-pt-xl q-pb-xs"
        >
          {{ t('title') }}
        </q-card-section>

        <q-card-section
          class="text-subtitle2 text-center text-grey-7 q-pt-none q-pb-sm"
        >
          {{ t('description') }}
        </q-card-section>

        <q-card-actions class="q-px-md q-pb-none">
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
          class="text-negative text-center text-bold q-py-sm"
        >
          {{ error }}
        </q-card-section>

        <q-card-section class="text-center q-pt-sm q-pb-lg">
          <q-btn
            color="primary"
            size="lg"
            class="full-width"
            :label="t('action.login')"
            :to="{ name: 'login' }"
            rounded
            outline
          />
        </q-card-section>
      </q-form>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth-store';
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

async function sendVerificationEmail() {
  await authStore.sendVerifyEmail();

  startCountdown();
}
</script>

<i18n lang="yaml" locale="en">
title: 'Verify your email'
description: 'We have sent a verification email to your email address. Please click on the link in the email to verify your account.'
action:
  login: 'Login'
  resend: 'Resend'
  resendIn: 'Resend in {time}s'
</i18n>

<i18n lang="yaml" locale="de">
title: 'E-Mail bestätigen'
description: 'Wir haben eine Bestätigungs-E-Mail an Ihre Adresse gesendet. Bitte klicken Sie auf den Link, um Ihr Konto zu verifizieren.'
action:
  login: 'Anmelden'
  resend: 'Erneut senden'
  resendIn: 'Erneut senden in {time}s'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Vérifiez votre adresse e-mail'
description: 'Nous vous avons envoyé un e-mail de vérification à votre adresse. Veuillez cliquer sur le lien pour vérifier votre compte.'
action:
  login: 'Connexion'
  resend: 'Renvoyer'
  resendIn: 'Renvoyer dans {time}s'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Potwierdź adres e-mail'
description: 'Wysłaliśmy wiadomość potwierdzającą na Twój adres e-mail. Kliknij w link, aby zweryfikować swoje konto.'
action:
  login: 'Zaloguj się'
  resend: 'Wyślij ponownie'
  resendIn: 'Wyślij ponownie za {time}s'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Potvrďte e-mail'
description: 'Odeslali jsme potvrzovací e-mail na vaši adresu. Klikněte na odkaz pro ověření vašeho účtu.'
action:
  login: 'Přihlásit se'
  resend: 'Znovu odeslat'
  resendIn: 'Znovu odeslat za {time}s'
</i18n>
