<template>
  <q-form @submit="onDisable">
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
          outlined
          rounded
          color="primary"
          class="col-12 col-md-6"
        >
          <template #prepend>
            <q-icon name="password" />
          </template>
        </q-input>

        <two-factor-code-input
          v-model="code"
          hide-bottom-space
          outlined
          rounded
          color="primary"
          class="col-12 col-md-6"
        />
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
        :label="t('action.disable')"
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
import TwoFactorCodeInput from '@/components/settings/twoFactor/TwoFactorCodeInput.vue';

const { t } = useI18n();

const { loading, error } = defineProps<{
  loading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  (e: 'disable', password: string, otp: string): void;
}>();

const password = ref<string>('');
const code = ref<string>('');

function onDisable() {
  emit('disable', password.value, code.value.trim());
}
</script>

<style lang="scss" scoped>
.error-banner {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}
</style>

<i18n lang="yaml" locale="en">
description: 'Two-factor authentication is currently active. You can disable it
  by entering your password and the OTP.'

field:
  password:
    label: 'Password'
    rule:
      required: 'Password is required.'

action:
  disable: 'Disable 2FA'
</i18n>

<i18n lang="yaml" locale="de">
description:
  'Die Zwei-Faktor-Authentifizierung ist derzeit aktiv. Sie können sie
  deaktivieren, indem Sie Ihr Passwort und das OTP eingeben.'

field:
  password:
    label: 'Passwort'
    rule:
      required: 'Passwort ist erforderlich.'

action:
  disable: '2FA deaktivieren'
</i18n>

<i18n lang="yaml" locale="fr">
description: "L'authentification à deux facteurs est actuellement active. Vous
  pouvez la désactiver en saisissant votre mot de passe et l'OTP."

field:
  password:
    label: 'Mot de passe'
    rule:
      required: 'Le mot de passe est requis.'

action:
  disable: 'Désactiver 2FA'
</i18n>

<i18n lang="yaml" locale="pl">
description: 'Uwierzytelnianie dwuskładnikowe jest obecnie aktywne. Możesz je wyłączyć, wprowadzając swoje hasło i kod OTP.'

field:
  password:
    label: 'Hasło'
    rule:
      required: 'Hasło jest wymagane.'

action:
  disable: 'Wyłącz 2FA'
</i18n>

<i18n lang="yaml" locale="cs">
description: 'Dvoufázové ověřování je momentálně aktivní. Můžete jej vypnout zadáním hesla a kódu OTP.'

field:
  password:
    label: 'Heslo'
    rule:
      required: 'Heslo je povinné.'

action:
  disable: 'Deaktivovat 2FA'
</i18n>
