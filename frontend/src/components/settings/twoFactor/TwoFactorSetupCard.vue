<template>
  <q-card>
    <q-form @submit="onSetup">
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
          :disable="loading"
          outlined
          rounded
          class="settings-input"
        >
          <template #before>
            <q-icon name="password" />
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
          :label="t('action.generate')"
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
  (e: 'setup', password: string, otp: string): void;
}>();

const password = ref<string>('');

function onSetup() {
  emit('setup', password.value, password.value);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Two-Factor Authentication'
description: 'To secure your account with two-factor authentication, please
  enter your password to generate a QR code for setup.'
field:
  password:
    label: 'Password'
    rule:
      required: 'Password is required.'
action:
  generate: 'Generate QR Code'
</i18n>
<i18n lang="yaml" locale="de">
title: 'Zwei-Faktor-Authentifizierung'
description: 'Um Ihr Konto mit der Zwei-Faktor-Authentifizierung zu sichern,
  geben Sie bitte Ihr Passwort ein, um einen QR-Code zur Einrichtung zu
  generieren.'
field:
  password:
    label: 'Passwort'
    rule:
      required: 'Passwort ist erforderlich.'
action:
  generate: 'QR-Code generieren'
</i18n>
<i18n lang="yaml" locale="fr">
title: 'Authentification à deux facteurs'
description: "Pour sécuriser votre compte avec l'authentification à deux
  facteurs, saisissez votre mot de passe pour générer un code QR pour la
  configuration."
field:
  password:
    label: 'Mot de passe'
    rule:
      required: 'Le mot de passe est requis.'
action:
  generate: 'Générer un code QR'
</i18n>
