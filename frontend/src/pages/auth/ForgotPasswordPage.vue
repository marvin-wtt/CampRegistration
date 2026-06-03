<template>
  <q-page
    class="row justify-center"
    :class="quasar.screen.gt.xs ? 'content-center' : ''"
  >
    <q-card
      class="auth-card col-xs-12 col-sm-8 col-md-6 col-lg-4"
      :flat="quasar.screen.lt.sm"
    >
      <div class="auth-card-header">
        <q-avatar
          icon="mail_outline"
          color="white"
          text-color="primary"
          size="64px"
          class="auth-card-avatar"
        />
      </div>

      <q-form
        class="column no-wrap"
        data-test="forgot-password-form"
        @submit="resetPassword"
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

        <q-card-section class="q-gutter-md q-pt-xs">
          <q-input
            v-model="email"
            :label="t('field.email.label')"
            type="email"
            autocomplete="email"
            :disable="loading"
            :rules="[(val?: string) => !!val || t('field.email.rule.required')]"
            hide-bottom-space
            data-test="email"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="alternate_email" />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions class="q-px-md q-pb-none">
          <q-btn
            :label="t('action.register')"
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

        <div class="q-pb-lg" />
      </q-form>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

const quasar = useQuasar();
const { t } = useI18n();

const authStore = useAuthStore();
const { loading, error } = storeToRefs(authStore);

const email = ref<string>('');

// Suppress any previous errors
authStore.reset();

function resetPassword() {
  void authStore.forgotPassword(email.value);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Forgot Password'

description: "Enter your email address, and we'll send you instructions to reset your password."

field:
  email:
    label: 'Email'
    rule:
      required: 'You must provide a valid email'

action:
  register: 'Reset password'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Passwort vergessen'

description: 'Geben Sie Ihre E-Mail-Adresse ein, und wir senden Ihnen Anweisungen zum Zurücksetzen Ihres Passworts.'

field:
  email:
    label: 'E-Mail'
    rule:
      required: 'Sie müssen eine gültige E-Mail-Adresse angeben'

action:
  register: 'Anweisungen senden'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Mot de passe oublié'

description: 'Entrez votre adresse e-mail, et nous vous enverrons des instructions pour réinitialiser votre mot de passe.'

field:
  email:
    label: 'E-mail'
    rule:
      required: 'Vous devez fournir une adresse e-mail valide'

action:
  register: 'Envoyer les instructions'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zapomniałeś hasła'

description: 'Wprowadź swój adres e-mail, a wyślemy Ci instrukcje dotyczące resetowania hasła.'

field:
  email:
    label: 'E-mail'
    rule:
      required: 'Musisz podać prawidłowy adres e-mail'

action:
  register: 'Wyślij instrukcje'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Zapomněli jste heslo'

description: 'Zadejte svůj e-mail a my vám pošleme pokyny k obnovení hesla.'

field:
  email:
    label: 'E-mail'
    rule:
      required: 'Musíte zadat platnou e-mailovou adresu'

action:
  register: 'Odeslat pokyny'
</i18n>
