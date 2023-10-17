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
            v-model="password"
            type="password"
            autocomplete="new-password"
            :rules="[(val) => !!val || t('fields.password.rules.required')]"
            :label="t('fields.password.label')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="key" />
            </template>
          </q-input>

          <q-input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            :rules="[
              (val) =>
                val === password ||
                t('fields.confirm-password.rules.identical'),
            ]"
            :label="t('fields.confirm-password.label')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="key" />
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
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';

const { t } = useI18n();

const password = ref<string>('');
const confirmPassword = ref<string>('');

const authStore = useAuthStore();
const { loading } = storeToRefs(authStore);

const error = computed(() => {
  return authStore.error;
});

onMounted(() => {
  // Suppress any previous errors
  authStore.reset();
});

function resetPassword() {
  authStore.resetPassword(password.value);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Reset Password'

fields:
  password:
    label: 'Password'
    rules:
      required: 'You must provide a valid password'
  confirm-password:
    label: 'Confirm Password'
    rules:
      identical: 'Password does not match'

actions:
  register: 'Reset Password'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Passwort zurücksetzen'

fields:
  password:
    label: 'Passwort'
    rules:
      required: 'Sie müssen ein gültiges Passwort angeben'
  confirm-password:
    label: 'Passwort bestätigen'
    rules:
      identical: 'Passwort stimmt nicht überein'

actions:
  register: 'Passwort zurücksetzen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Réinitialiser le mot de passe'

fields:
  password:
    label: 'Mot de passe'
    rules:
      required: 'Vous devez fournir un mot de passe valide'
  confirm-password:
    label: 'Confirmer le mot de passe'
    rules:
      identical: 'Les mots de passe ne correspondent pas'

actions:
  register: 'Réinitialiser le mot de passe'
</i18n>
