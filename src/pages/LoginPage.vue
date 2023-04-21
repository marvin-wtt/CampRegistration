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
              :disable="isLoading"
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
            :loading="isLoading"
            type="submit"
            color="primary"
            size="lg"
            class="full-width"
            :label="t('actions.login')"
            rounded
          />
        </q-card-actions>
        <!-- Error -->
        <q-card-section v-if="error != null">
          <a class="text-negative">
            {{ error }}
          </a>
        </q-card-section>

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
const { isLoading, error } = storeToRefs(authStore);

const emailError = computed<string | undefined>(() => {
  if (
    authStore.error === null ||
    typeof email.value !== 'object' ||
    !('email' in email.value)
  ) {
    return undefined;
  }

  return email.value.email;
});

const passwordError = computed<string | undefined>(() => {
  if (
    email.value == null ||
    typeof email.value !== 'object' ||
    !('password' in email.value)
  ) {
    return undefined;
  }

  return email.value.password;
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
  create_new: 'Create New'
  forgot_password: 'Forgot password ?'
</i18n>
