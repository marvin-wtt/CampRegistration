<template>
  <q-form @submit="onSetup">
    <q-card-section>
      <div class="text-body2 text-on-surface-variant q-mb-md">
        {{ t('description') }}
      </div>

      <div class="row q-col-gutter-md">
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
          color="primary"
          class="col-12 col-md-6"
        >
          <template #prepend>
            <q-icon name="password" />
          </template>
        </q-input>
      </div>

      <q-banner
        v-if="error"
        dense
        class="error-banner rounded-md q-mt-md"
      >
        <template #avatar>
          <q-icon name="warning" />
        </template>
        {{ error }}
      </q-banner>
    </q-card-section>

    <q-card-actions>
      <m-btn
        :label="t('action.generate')"
        type="submit"
        color="primary"
        :loading
      />
    </q-card-actions>
  </q-form>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

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

<style lang="scss" scoped>
.error-banner {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}
</style>

<i18n lang="yaml" locale="en">
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

<i18n lang="yaml" locale="pl">
description: 'Aby zabezpieczyć swoje konto za pomocą uwierzytelniania dwuskładnikowego, wprowadź swoje hasło, aby wygenerować kod QR do konfiguracji.'
field:
  password:
    label: 'Hasło'
    rule:
      required: 'Hasło jest wymagane.'
action:
  generate: 'Wygeneruj kod QR'
</i18n>

<i18n lang="yaml" locale="cs">
description: 'Pro zabezpečení vašeho účtu pomocí dvoufázového ověřování zadejte své heslo a vygenerujte QR kód pro nastavení.'
field:
  password:
    label: 'Heslo'
    rule:
      required: 'Heslo je povinné.'
action:
  generate: 'Vygenerovat QR kód'
</i18n>
