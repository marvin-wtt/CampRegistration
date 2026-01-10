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
        data-test="totp-form"
        @submit="verify"
      >
        <q-card-section class="text-h4 text-bold text-center">
          {{ t('title') }}
        </q-card-section>

        <!-- Description -->
        <q-card-section class="text-subtitle1 text-center">
          {{ t('description') }}
        </q-card-section>

        <q-card-section class="row justify-center">
          <q-avatar
            icon="verified_user"
            color="primary"
            text-color="white"
            size="100px"
          />
        </q-card-section>

        <q-card-section>
          <otp-input
            v-model="otp"
            :length="6"
            :disable="loading"
            required
            data-test="totp"
          />
        </q-card-section>

        <q-card-actions class="q-ma-md">
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
          class="text-negative text-center text-bold"
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
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';
import OtpInput from 'components/auth/OtpInput.vue';
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

description: 'Pour continuer, ouvrez votre application d’authentification et saisissez le code à 6 chiffres affiché.'

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
