<template>
  <q-page class="row justify-center content-center">
    <q-card
      class="auth-card col-xs-12 col-sm-8 col-md-6 col-lg-4"
      :flat="quasar.screen.lt.sm"
    >
      <div class="auth-card-header">
        <q-avatar
          icon="shield"
          color="white"
          text-color="primary"
          size="64px"
          class="auth-card-avatar"
        />
      </div>

      <q-form
        class="column no-wrap"
        data-test="totp-form"
        @submit="verify"
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

        <q-card-section class="q-pt-xs">
          <otp-input
            v-model="otp"
            :length="6"
            :disable="loading"
            required
            data-test="totp"
          />
        </q-card-section>

        <q-card-actions class="q-px-md">
          <q-btn
            :label="t('action.verify')"
            type="submit"
            :loading
            color="primary"
            size="lg"
            class="full-width"
            data-test="submit"
            rounded
          />
        </q-card-actions>

        <q-card-section
          v-if="error"
          class="text-negative text-center text-bold q-py-sm"
          data-test="error"
        >
          {{ error }}
        </q-card-section>
      </q-form>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth-store';
import { storeToRefs } from 'pinia';
import OtpInput from '@/components/auth/OtpInput.vue';
import { useQuasar } from 'quasar';

const quasar = useQuasar();
const { t } = useI18n();

const authStore = useAuthStore();
const { loading, error } = storeToRefs(authStore);

const otp = ref<string>('');

authStore.reset();

function verify() {
  void authStore.verifyOtp(otp.value);
}
</script>

<i18n lang="yaml" locale="en">
title: 'OTP Verifciation'

description: 'To proceed, open your authenticator app and enter the 6-digit code displayed.'

action:
  verify: 'Verify'
</i18n>

<i18n lang="yaml" locale="de">
title: 'OTP-Verifizierung'

description: 'Um fortzufahren, öffnen Sie Ihre Authentifizierungs-App und geben Sie den angezeigten 6-stelligen Code ein.'

action:
  verify: 'Verifizieren'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Vérification OTP'

description: "Pour continuer, ouvrez votre application d'authentification et saisissez le code à 6 chiffres affiché."

action:
  verify: 'Vérifier'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Weryfikacja OTP'

description: 'Aby kontynuować, otwórz swoją aplikację uwierzytelniającą i wprowadź wyświetlony 6-cyfrowy kod.'

action:
  verify: 'Zweryfikuj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Ověření OTP'

description: 'Chcete-li pokračovat, otevřete svou autentizační aplikaci a zadejte zobrazený 6místný kód.'

action:
  verify: 'Ověřit'
</i18n>
