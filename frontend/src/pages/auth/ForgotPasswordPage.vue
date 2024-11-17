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
      <q-form @submit="resetPassword">
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="email"
            type="email"
            autocomplete="email"
            :rules="[
              (val?: string) => !!val || t('fields.email.rules.required'),
            ]"
            :label="t('fields.email.label')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="alternate_email" />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions>
          <q-btn
            :loading="loading"
            type="submit"
            color="primary"
            size="lg"
            class="full-width"
            :label="t('actions.register')"
            rounded
          />
        </q-card-actions>

        <q-card-section
          v-if="error"
          class="text-negative text-center text-bold"
        >
          {{ error }}
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

const authStore = useAuthStore();
const { loading } = storeToRefs(authStore);

// Suppress any previous errors
authStore.reset();

const error = computed(() => {
  return authStore.error;
});

function resetPassword() {
  authStore.forgotPassword(email.value);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Forgot Password'

fields:
  email:
    label: 'Email'
    rules:
      required: 'You must provide a valid email'

actions:
  register: 'Reset password'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Passwort vergessen'

fields:
  email:
    label: 'E-Mail'
    rules:
      required: 'Sie müssen eine gültige E-Mail-Adresse angeben'

actions:
  register: 'Passwort zurücksetzen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Mot de passe oublié'

fields:
  email:
    label: 'E-mail'
    rules:
      required: 'Vous devez fournir une adresse e-mail valide'

actions:
  register: 'Réinitialiser le mot de passe'
</i18n>
