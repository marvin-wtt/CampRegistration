<template>
  <registration-form
    icon="how_to_reg"
    :title="t('title')"
    :submit-label="t('action.register')"
    :loading="loading"
    :error="error"
    @submit="onSubmit"
  >
    <template #footer>
      <q-card-section class="text-center q-pt-sm q-pb-lg">
        <q-btn
          color="primary"
          size="lg"
          class="full-width"
          :label="t('action.login')"
          :to="{ name: 'login' }"
          rounded
          outline
        />
      </q-card-section>
    </template>
  </registration-form>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';
import RegistrationForm, {
  type RegistrationCredentials,
} from 'components/auth/RegistrationForm.vue';

const { t } = useI18n();

const authStore = useAuthStore();
const { loading, error } = storeToRefs(authStore);

// Suppress any previous errors
authStore.reset();

function onSubmit(credentials: RegistrationCredentials) {
  void authStore.register(
    credentials.name,
    credentials.email,
    credentials.password,
  );
}
</script>

<i18n lang="yaml" locale="en">
title: 'Register'
action:
  login: 'Login'
  register: 'Register'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Registrieren'
action:
  login: 'Anmelden'
  register: 'Registrieren'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Inscription'
action:
  login: 'Connexion'
  register: "S'inscrire"
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zarejestruj się'
action:
  login: 'Zaloguj się'
  register: 'Zarejestruj się'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Registrovat se'
action:
  login: 'Přihlásit se'
  register: 'Registrovat se'
</i18n>
