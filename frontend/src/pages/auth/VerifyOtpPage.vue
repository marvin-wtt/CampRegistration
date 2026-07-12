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
          {{ useRecovery ? t('recovery.description') : t('description') }}
        </q-card-section>

        <q-card-section class="q-pt-xs">
          <otp-input
            v-if="!useRecovery"
            v-model="otp"
            :length="6"
            :disable="loading"
            required
            data-test="totp"
          />

          <q-input
            v-else
            v-model="recoveryCode"
            :label="t('recovery.label')"
            :disable="loading"
            autocomplete="one-time-code"
            outlined
            rounded
            autofocus
            data-test="recovery-code"
          >
            <template #before>
              <q-icon name="vpn_key" />
            </template>
          </q-input>
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

        <q-card-section class="text-center q-pt-none q-pb-sm">
          <a
            href="#"
            class="recovery-toggle"
            data-test="recovery-toggle"
            @click.prevent="toggleRecovery"
          >
            {{ useRecovery ? t('recovery.useApp') : t('recovery.useCode') }}
          </a>
        </q-card-section>

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
const recoveryCode = ref<string>('');
const useRecovery = ref<boolean>(false);

authStore.reset();

function toggleRecovery() {
  useRecovery.value = !useRecovery.value;
  authStore.reset();
}

function verify() {
  const code = useRecovery.value ? recoveryCode.value.trim() : otp.value;
  void authStore.verifyOtp(code);
}
</script>

<style scoped lang="scss">
.recovery-toggle {
  color: var(--md3-primary);
  font-size: 0.875rem;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'OTP Verifciation'

description: 'To proceed, open your authenticator app and enter the 6-digit code displayed.'

recovery:
  description: 'Enter one of your recovery codes to sign in.'
  label: 'Recovery code'
  useCode: 'Use a recovery code instead'
  useApp: 'Use your authenticator app instead'

action:
  verify: 'Verify'
</i18n>

<i18n lang="yaml" locale="de">
title: 'OTP-Verifizierung'

description: 'Um fortzufahren, öffnen Sie Ihre Authentifizierungs-App und geben Sie den angezeigten 6-stelligen Code ein.'

recovery:
  description: 'Geben Sie einen Ihrer Wiederherstellungscodes ein, um sich anzumelden.'
  label: 'Wiederherstellungscode'
  useCode: 'Stattdessen einen Wiederherstellungscode verwenden'
  useApp: 'Stattdessen die Authentifizierungs-App verwenden'

action:
  verify: 'Verifizieren'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Vérification OTP'

description: "Pour continuer, ouvrez votre application d'authentification et saisissez le code à 6 chiffres affiché."

recovery:
  description: 'Saisissez l’un de vos codes de récupération pour vous connecter.'
  label: 'Code de récupération'
  useCode: 'Utiliser plutôt un code de récupération'
  useApp: "Utiliser plutôt votre application d'authentification"

action:
  verify: 'Vérifier'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Weryfikacja OTP'

description: 'Aby kontynuować, otwórz swoją aplikację uwierzytelniającą i wprowadź wyświetlony 6-cyfrowy kod.'

recovery:
  description: 'Wprowadź jeden ze swoich kodów odzyskiwania, aby się zalogować.'
  label: 'Kod odzyskiwania'
  useCode: 'Użyj zamiast tego kodu odzyskiwania'
  useApp: 'Użyj zamiast tego aplikacji uwierzytelniającej'

action:
  verify: 'Zweryfikuj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Ověření OTP'

description: 'Chcete-li pokračovat, otevřete svou autentizační aplikaci a zadejte zobrazený 6místný kód.'

recovery:
  description: 'Zadejte jeden ze svých kódů pro obnovení a přihlaste se.'
  label: 'Kód pro obnovení'
  useCode: 'Použít místo toho kód pro obnovení'
  useApp: 'Použít místo toho autentizační aplikaci'

action:
  verify: 'Ověřit'
</i18n>
