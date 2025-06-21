<template>
  <q-card flat>
    <q-form @submit="onDisable">
      <q-card-section class="text-h4">
        {{ t('title') }}
      </q-card-section>

      <q-card-section class="text-subtitle-2">
        {{ t('description') }}
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <q-input
          v-model="password"
          :label="t('field.password.label')"
          type="password"
          autocomplete="current-password"
          :rules="[
            (val?: string) => !!val || t('field.password.rule.required'),
          ]"
          hide-bottom-space
          outlined
          rounded
          class="settings-input"
        >
          <template #before>
            <q-icon name="password" />
          </template>
        </q-input>

        <q-input
          v-model="otp"
          :label="t('field.otp.label')"
          :rules="[
            (val?: string) => !!val || t('field.otp.rule.required'),
            (val: string) => val.length === 6 || t('field.otp.rule.required'),
          ]"
          hide-bottom-space
          mask="######"
          outlined
          rounded
          class="settings-input"
        >
          <template #before>
            <q-icon name="pin" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section
        v-if="error"
        class="text-negative q-ma-none q-py-xs"
      >
        {{ error }}
      </q-card-section>

      <q-card-actions>
        <q-btn
          :label="t('action.disable')"
          type="submit"
          color="primary"
          :loading
          outlined
          rounded
        />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { loading, error } = defineProps<{
  loading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  (e: 'disable', password: string, otp: string): void;
}>();

const password = ref<string>('');
const otp = ref<string>('');

function onDisable() {
  emit('disable', password.value, otp.value);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Two-Factor Authentication'

description: 'Two-factor authentication is currently active. You can disable it
  by entering your password and the OTP.'

field:
  password:
    label: 'Password'
    rule:
      required: 'Password is required.'
  otp:
    label: 'OTP'
    rule:
      required: 'OTP is required.'
      invalid: 'OTP must be 6 digits.'

action:
  disable: 'Disable 2FA'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Two-Factor Authentication'

description: 'Two-factor authentication is currently active. You can disable it
  by entering your password and the OTP.'

field:
  password:
    label: 'Passwort'
    rule:
      required: 'Passwort ist erforderlich.'
  otp:
    label: 'OTP'
    rule:
      required: 'OTP ist erforderlich.'
      invalid: 'OTP muss 6 Ziffern haben.'

action:
  disable: '2FA deaktivieren'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Authentification à deux facteurs'
description: "L'authentification à deux facteurs est actuellement activée. Vous
  pouvez la désactiver en saisissant votre mot de passe et l'OTP."
field:
  password:
    label: 'Mot de passe'
    rule:
      required: 'Le mot de passe est requis.'
  otp:
    label: 'OTP'
    rule:
      required: "L'OTP est requis."
      invalid: "L'OTP doit contenir 6 chiffres."

action:
  disable: 'Désactiver 2FA'
</i18n>
