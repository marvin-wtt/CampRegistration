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
        data-test="reset-password-form"
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
            icon="vpn_key"
            color="primary"
            text-color="white"
            size="100px"
          />
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="password"
            :label="t('field.password.label')"
            type="password"
            autocomplete="new-password"
            :rules="[
              (val?: string) => !!val || t('field.password.rules.required'),
            ]"
            hide-bottom-space
            data-test="password"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="key" />
            </template>
          </q-input>

          <q-input
            v-model="confirmPassword"
            :label="t('field.confirm-password.label')"
            type="password"
            autocomplete="new-password"
            :disable="loading"
            :rules="[
              (val?: string) =>
                val === password || t('field.confirm-password.rule.identical'),
            ]"
            hide-bottom-space
            data-test="confirm-password"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="key" />
            </template>
          </q-input>
        </q-card-section>

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

const password = ref<string>('');
const confirmPassword = ref<string>('');

// Suppress any previous errors
authStore.reset();

function resetPassword() {
  authStore.resetPassword(password.value);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Reset Password'

description: 'Create a new password to regain access to your account.'

field:
  password:
    label: 'New Password'
    rule:
      required: 'You must provide a valid password'
  confirm-password:
    label: 'Confirm Password'
    rule:
      identical: 'Password does not match'

action:
  register: 'Reset Password'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Passwort zurücksetzen'

describe: 'Erstellen Sie ein neues Passwort, um wieder Zugriff auf Ihr Konto zu erhalten.'

field:
  password:
    label: 'Neues Passwort'
    rule:
      required: 'Sie müssen ein gültiges Passwort angeben'
  confirm-password:
    label: 'Passwort bestätigen'
    rule:
      identical: 'Passwort stimmt nicht überein'

action:
  register: 'Passwort zurücksetzen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Réinitialiser le mot de passe'

describe: "Créez un nouveau mot de passe pour retrouver l'accès à votre compte."

field:
  password:
    label: 'Nouveau mot de passe'
    rule:
      required: 'Vous devez fournir un mot de passe valide'
  confirm-password:
    label: 'Confirmer le mot de passe'
    rule:
      identical: 'Les mots de passe ne correspondent pas'

action:
  register: 'Réinitialiser le mot de passe'
</i18n>
