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
            :rules="[(val) => !!val || t('fields.email.rules.required')]"
            :error="emailError !== undefined ? true : undefined"
            :error-message="emailError"
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
            :rules="[(val) => !!val || t('fields.password.rules.required')]"
            :error="passwordError !== undefined ? true : undefined"
            :error-message="passwordError"
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
              to="/forgot-password"
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

        <q-separator spaced />

        <q-card-section class="text-center">
          <q-btn
            color="primary"
            size="lg"
            class="full-width"
            :label="t('actions.create_new')"
            rounded
            outline
          />
        </q-card-section>
      </q-form>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';

const { t } = useI18n();

const email = ref<string>('');
const password = ref<string>('');
const remember = ref<boolean>(false);

const authStore = useAuthStore();
const { loading } = storeToRefs(authStore);

const emailError = computed<string | undefined>(() => {
  const error = authStore.error;

  if (!hasEmailErrorField(error)) {
    return undefined;
  }

  return error.email[0];
});

const passwordError = computed<string | undefined>(() => {
  const error = authStore.error;
  if (!hasPasswordErrorField(error)) {
    return undefined;
  }

  return error.password;
});

function login() {
  authStore.login(email.value, password.value, remember.value);
}

function hasEmailErrorField(e: unknown): e is { email: string[] } {
  return (
    e !== null &&
    typeof e === 'object' &&
    'email' in e &&
    Array.isArray(e.email)
  );
}

function hasPasswordErrorField(e: unknown): e is { password: string } {
  return (
    e !== null &&
    typeof e === 'object' &&
    'password' in e &&
    typeof e.password === 'string'
  );
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
  create_new: 'Create New'
  forgot_password: 'Forgot password ?'
</i18n>
