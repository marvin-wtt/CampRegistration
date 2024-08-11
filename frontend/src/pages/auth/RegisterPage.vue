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
      <q-form @submit="register">
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="name"
            :rules="[(val?: string) => !!val || t('field.name.rule.required')]"
            :label="t('field.name.label')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="email"
            type="email"
            autocomplete="email"
            :rules="[(val?: string) => !!val || t('field.email.rule.required')]"
            :label="t('field.email.label')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="alternate_email" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            type="password"
            autocomplete="new-password"
            :rules="passwordRules"
            :label="t('field.password.label')"
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
              (val?: string) =>
                val === password || t('field.confirm-password.rule.identical'),
            ]"
            :label="t('field.confirm-password.label')"
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
            :label="t('action.register')"
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
            :label="t('action.login')"
            :to="{ name: 'login' }"
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

const { t } = useI18n();

const name = ref<string>('');
const email = ref<string>('');
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

const passwordRequirements = {
  min: 8,
  max: 26,
  lowerCase: 1,
  upperCase: 1,
  symbol: 1,
  numeric: 1,
  requirementCount: 3,
};

const passwordRules = [
  (val: string) =>
    val.length >= passwordRequirements.min ||
    t('field.password.rule.minLength', { min: passwordRequirements.min }),
  (val: string) =>
    val.length <= passwordRequirements.max ||
    t('field.password.rule.maxLength', { max: passwordRequirements.max }),
  (val: string) =>
    (val.match(/[a-z]/g) || []).length >= passwordRequirements.lowerCase ||
    t('field.password.rule.lowerCase', {
      count: passwordRequirements.lowerCase,
    }),
  (val: string) =>
    (val.match(/[A-Z]/g) || []).length >= passwordRequirements.upperCase ||
    t('field.password.rule.upperCase', {
      count: passwordRequirements.upperCase,
    }),
  (val: string) =>
    (val.match(/[!@#$%^&*()\-_=+\[\\\]{}|;:",.<>?]/g) || []).length >=
      passwordRequirements.symbol ||
    t('field.password.rule.symbol', { count: passwordRequirements.symbol }),
  (val: string) =>
    (val.match(/[0-9]/g) || []).length >= passwordRequirements.numeric ||
    t('field.password.rule.numeric', { count: passwordRequirements.numeric }),
];

function register() {
  authStore.register(name.value, email.value, password.value);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Register'

field:
  name:
    label: 'First and last name'
    rule:
      required: 'You must provide a name'
  email:
    label: 'Email'
    rule:
      required: 'You must provide a valid email'
  password:
    label: 'Password'
    rule:
      minLength: 'Minimum length is {min}'
      maxLength: 'Maximum length is {max}'
      lowerCase: 'At least {count} lowercase letter(s) required'
      upperCase: 'At least {count} uppercase letter(s) required'
      symbol: 'At least {count} symbol(s) required'
      numeric: 'At least {count} number(s) required'
      requirementCount: 'At least {count} out of 4 character types required'
  confirm-password:
    label: 'Confirm Password'
    rule:
      identical: 'Password does not match'

action:
  login: 'Login'
  register: 'Register'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Registrieren'

field:
  name:
    label: 'Vor- und Nachname'
    rule:
      required: 'Sie müssen einen Namen angeben'
  email:
    label: 'E-Mail'
    rule:
      required: 'Sie müssen eine gültige E-Mail-Adresse angeben'
  password:
    label: 'Passwort'
    rule:
      minLength: 'Die Mindestlänge beträgt {min}',
      maxLength: 'Die Maximallänge beträgt {max}',
      lowerCase: 'Mindestens {count} Kleinbuchstabe(n) erforderlich',
      upperCase: 'Mindestens {count} Großbuchstabe(n) erforderlich',
      symbol: 'Mindestens {count} Symbol(e) erforderlich',
      numeric: 'Mindestens {count} Zahl(en) erforderlich',
      requirementCount: 'Mindestens {count} von 4 Zeichenarten erforderlich',
  confirm-password:
    label: 'Passwort bestätigen'
    rule:
      identical: 'Passwörter stimmen nicht überein'

action:
  login: 'Anmelden'
  register: 'Registrieren'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Inscription'

fields:
  name:
    label: 'Nom et prénom'
    rule:
      required: 'Vous devez fournir un nom'
  email:
    label: 'E-mail'
    rule:
      required: 'Vous devez fournir une adresse e-mail valide'
  password:
    label: 'Mot de passe'
    rule:
      minLength: 'La longueur minimale est de {min}',
      maxLength: 'La longueur maximale est de {max}',
      lowerCase: 'Au moins {count} lettre(s) minuscule(s) requise(s)',
      upperCase: 'Au moins {count} lettre(s) majuscule(s) requise(s)',
      symbol: 'Au moins {count} symbole(s) requis',
      numeric: 'Au moins {count} chiffre(s) requis',
      requirementCount: 'Au moins {count} des 4 types de caractères requis',
  confirm-password:
    label: 'Confirmer le mot de passe'
    rule:
      identical: 'Les mots de passe ne correspondent pas'

action:
  login: 'Connexion'
  register: "S'inscrire"
</i18n>
