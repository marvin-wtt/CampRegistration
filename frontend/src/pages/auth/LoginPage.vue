<template>
  <q-page
    padding
    class="fit row justify-center content-center"
  >
    <!-- content -->
    <q-card class="q-pa-md col-xs-12 col-sm-8 col-md-5 col-lg-3">
      <q-card-section>
        <a class="text-h4">
          {{ t('title') }}
        </a>
      </q-card-section>
      <q-form @submit="login">
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="email"
            type="email"
            autocomplete="username"
            :rules="[
              (val: string) => !!val || t('fields.email.rules.required'),
            ]"
            :label="t('fields.email.label')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            type="password"
            autocomplete="current-password"
            :rules="[
              (val: string) => !!val || t('fields.password.rules.required'),
            ]"
            :label="t('fields.password.label')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="key" />
            </template>
          </q-input>

          <div class="row justify-between">
            <q-checkbox
              v-model="remember"
              :label="t('fields.remember')"
              class="col-shrink"
              :disable="loading"
            />

            <router-link
              :to="{ name: 'forgot-password' }"
              style="text-decoration: none; color: inherit"
              class="col-shrink flex justify-center content-center"
            >
              {{ t('actions.forgot_password') }}
            </router-link>
          </div>
        </q-card-section>

        <q-card-actions>
          <q-btn
            :loading="loading"
            type="submit"
            color="primary"
            size="lg"
            class="full-width"
            :label="t('actions.login')"
            rounded
          />
        </q-card-actions>

        <q-card-section
          v-if="error"
          class="text-negative text-center text-bold"
        >
          {{ error }}
        </q-card-section>

        <q-separator spaced />

        <q-card-section class="text-center">
          <q-btn
            color="primary"
            size="lg"
            class="full-width"
            :label="t('actions.register')"
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

const { t } = useI18n();
const route = useRoute();

const email = ref<string>('');
const password = ref<string>('');
const remember = ref<boolean>(false);

const authStore = useAuthStore();
const { loading } = storeToRefs(authStore);

const error = computed(() => {
  return authStore.error;
});

onMounted(() => {
  // Suppress any previous errors
  authStore.reset();

  const queryToken = route.query.token;
  const queryEmail = route.query.email;

  // Verify email
  if (typeof queryToken === 'string') {
    authStore.verifyEmail(queryToken);
  }

  // Set email field
  if (typeof queryEmail === 'string') {
    email.value = queryEmail;
  }
});

function login() {
  authStore.login(email.value, password.value, remember.value);
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

actions:
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

actions:
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

actions:
  login: 'Connexion'
  register: "S'inscrire"
  forgot_password: 'Mot de passe oublié ?'
</i18n>
