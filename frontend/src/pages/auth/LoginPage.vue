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
        data-test="login-form"
        @submit="login"
      >
        <q-card-section class="text-h4 text-bold text-center">
          {{ t('title') }}
        </q-card-section>

        <q-card-section class="row justify-center">
          <q-avatar
            icon="account_circle"
            color="primary"
            text-color="white"
            size="100px"
          />
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="email"
            :label="t('fields.email.label')"
            type="email"
            autocomplete="username"
            :disable="loading"
            :rules="[
              (val: string) => !!val || t('fields.email.rules.required'),
            ]"
            hide-bottom-space
            data-test="email"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :label="t('fields.password.label')"
            type="password"
            autocomplete="current-password"
            :disable="loading"
            :rules="[
              (val: string) => !!val || t('fields.password.rules.required'),
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

          <div class="row justify-between reverse-wrap">
            <q-checkbox
              v-model="remember"
              :label="t('fields.remember')"
              :disable="loading"
              class="col-shrink q-pa-sm"
              data-test="remember"
            />

            <router-link
              :to="{ name: 'forgot-password' }"
              style="text-decoration: none; color: inherit"
              class="col-shrink flex justify-center content-center q-pa-sm text-primary"
            >
              {{ t('action.forgot_password') }}
            </router-link>
          </div>
        </q-card-section>

        <q-card-actions>
          <q-btn
            :label="t('action.login')"
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

        <q-card-section class="text-center">
          <q-btn
            color="primary"
            size="lg"
            class="full-width"
            :label="t('action.register')"
            :to="{ name: 'register' }"
            rounded
            outline
          />
        </q-card-section>
      </q-form>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';

const quasar = useQuasar();
const { t } = useI18n();
const route = useRoute();

const email = ref<string>('');
const password = ref<string>('');
const remember = ref<boolean>(route.query.remember === 'true');

const authStore = useAuthStore();
const { loading } = storeToRefs(authStore);

const error = computed(() => {
  return authStore.error;
});

onMounted(async () => {
  // Suppress any previous errors
  authStore.reset();

  const queryToken = route.query.token;
  const queryEmail = route.query.email;

  // Verify email
  if (typeof queryToken === 'string') {
    await authStore.verifyEmail(queryToken);
  }

  // Set email field
  if (typeof queryEmail === 'string') {
    email.value = queryEmail;
  }
});

function login() {
  void authStore.login(email.value, password.value, remember.value);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Login'

fields:
  email:
    label: 'Email'
    rules:
      required: 'You must provide a valid email'
  password:
    label: 'Password'
    rules:
      required: 'You must provide a valid password'
  remember: 'Stay logged in'

action:
  login: 'Login'
  register: 'Register'
  forgot_password: 'Forgot password ?'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Anmelden'

fields:
  email:
    label: 'E-Mail'
    rules:
      required: 'Sie müssen eine gültige E-Mail-Adresse angeben'
  password:
    label: 'Passwort'
    rules:
      required: 'Sie müssen ein gültiges Passwort angeben'
  remember: 'Angemeldet bleiben'

action:
  login: 'Anmelden'
  register: 'Registrieren'
  forgot_password: 'Passwort vergessen?'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Connexion'

fields:
  email:
    label: 'E-mail'
    rules:
      required: 'Vous devez fournir une adresse e-mail valide'
  password:
    label: 'Mot de passe'
    rules:
      required: 'Vous devez fournir un mot de passe valide'
  remember: 'Rester connecté'

action:
  login: 'Connexion'
  register: "S'inscrire"
  forgot_password: 'Mot de passe oublié ?'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zaloguj się'

fields:
  email:
    label: 'E-mail'
    rules:
      required: 'Musisz podać prawidłowy adres e-mail'
  password:
    label: 'Hasło'
    rules:
      required: 'Musisz podać prawidłowe hasło'
  remember: 'Pozostań zalogowany'

action:
  login: 'Zaloguj się'
  register: 'Zarejestruj się'
  forgot_password: 'Zapomniałeś hasła?'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Přihlásit se'

fields:
  email:
    label: 'E-mail'
    rules:
      required: 'Musíte zadat platnou e-mailovou adresu'
  password:
    label: 'Heslo'
    rules:
      required: 'Musíte zadat platné heslo'
  remember: 'Zůstat přihlášen'

action:
  login: 'Přihlásit se'
  register: 'Registrovat se'
  forgot_password: 'Zapomněli jste heslo?'
</i18n>
