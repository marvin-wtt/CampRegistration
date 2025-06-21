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
        data-test="forgot-password-form"
        @submit="resetPassword"
      >
        <!-- Title -->
        <q-card-section class="text-h4 text-bold text-center">
          {{ t('title') }}
        </q-card-section>

        <!-- Description -->
        <q-card-section class="text-subtitle1 text-center">
          {{ t('description') }}
        </q-card-section>

        <!-- Avatar -->
        <q-card-section class="row justify-center">
          <q-avatar
            icon="mail_outline"
            color="primary"
            text-color="white"
            size="100px"
          />
        </q-card-section>

        <!-- Input -->
        <q-card-section class="q-gutter-md">
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

        <!-- Action -->
        <q-card-actions>
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

        <!-- Error -->
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
import { useQuasar } from 'quasar';

const quasar = useQuasar();
const { t } = useI18n();

const authStore = useAuthStore();
const { loading, error } = storeToRefs(authStore);

const email = ref<string>('');

// Suppress any previous errors
authStore.reset();

function resetPassword() {
  authStore.forgotPassword(email.value);
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
