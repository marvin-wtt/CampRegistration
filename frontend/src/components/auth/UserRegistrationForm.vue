<template>
  <q-page
    class="row justify-center"
    :class="quasar.screen.gt.xs ? 'content-center' : ''"
  >
    <q-card
      class="auth-card col-xs-12 col-sm-8 col-md-6 col-lg-4"
      :flat="quasar.screen.lt.sm"
    >
      <div class="auth-card-header">
        <q-avatar
          :icon="icon"
          color="white"
          text-color="primary"
          size="64px"
          class="auth-card-avatar"
        />
      </div>

      <q-form
        class="column no-wrap"
        data-test="registration-form"
        @submit="onSubmit"
      >
        <q-card-section
          class="text-h5 text-weight-bold text-center q-pt-xl q-pb-none"
        >
          {{ title }}
        </q-card-section>

        <q-card-section
          v-if="subtitle"
          class="text-center text-body2 text-grey-7 q-pb-none"
        >
          {{ subtitle }}
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="name"
            :label="t('field.name.label')"
            :rules="[(val?: string) => !!val || t('field.name.rule.required')]"
            hide-bottom-space
            data-test="name"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="email"
            :label="t('field.email.label')"
            type="email"
            autocomplete="email"
            :rules="[(val?: string) => !!val || t('field.email.rule.required')]"
            hide-bottom-space
            data-test="email"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="alternate_email" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :label="t('field.password.label')"
            type="password"
            autocomplete="new-password"
            :rules="passwordRules"
            hide-bottom-space
            data-test="password"
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
            data-test="confirm-password"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="key" />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions
          class="q-px-md"
          :class="hasFooter ? 'q-pb-none' : 'q-pb-lg'"
        >
          <q-btn
            :label="submitLabel"
            type="submit"
            color="primary"
            size="lg"
            class="full-width"
            :loading="loading"
            data-test="submit"
            rounded
          />
        </q-card-actions>

        <q-card-section
          v-if="error"
          class="text-negative text-center text-bold q-py-sm"
          data-test="error"
        >
          {{ error }}
        </q-card-section>

        <slot name="footer" />
      </q-form>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, ref, useSlots } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

export interface RegistrationCredentials {
  name: string;
  email: string;
  password: string;
}

const {
  icon,
  title,
  submitLabel,
  subtitle,
  loading = false,
  error = null,
} = defineProps<{
  icon: string;
  title: string;
  submitLabel: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  submit: [credentials: RegistrationCredentials];
}>();

const quasar = useQuasar();
const slots = useSlots();
const { t } = useI18n();

const hasFooter = computed(() => slots.footer !== undefined);

const name = ref<string>('');
const email = ref<string>('');
const password = ref<string>('');
const confirmPassword = ref<string>('');

const passwordRequirements = {
  min: 8,
  max: 26,
  lowerCase: 1,
  upperCase: 1,
  symbol: 1,
  numeric: 1,
};

const passwordRules = computed(() => [
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
    (val.match(/[!@#$%^&*()\-_=+[\\\]{}|;:",.<>?]/g) || []).length >=
      passwordRequirements.symbol ||
    t('field.password.rule.symbol', { count: passwordRequirements.symbol }),
  (val: string) =>
    (val.match(/[0-9]/g) || []).length >= passwordRequirements.numeric ||
    t('field.password.rule.numeric', { count: passwordRequirements.numeric }),
]);

function onSubmit() {
  emit('submit', {
    name: name.value,
    email: email.value,
    password: password.value,
  });
}
</script>

<i18n lang="yaml" locale="en">
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
  confirm-password:
    label: 'Confirm Password'
    rule:
      identical: 'Password does not match'
</i18n>

<i18n lang="yaml" locale="de">
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
      minLength: 'Die Mindestlänge beträgt {min}'
      maxLength: 'Die Maximallänge beträgt {max}'
      lowerCase: 'Mindestens {count} Kleinbuchstabe(n) erforderlich'
      upperCase: 'Mindestens {count} Großbuchstabe(n) erforderlich'
      symbol: 'Mindestens {count} Symbol(e) erforderlich'
      numeric: 'Mindestens {count} Zahl(en) erforderlich'
  confirm-password:
    label: 'Passwort bestätigen'
    rule:
      identical: 'Passwörter stimmen nicht überein'
</i18n>

<i18n lang="yaml" locale="fr">
field:
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
      minLength: 'La longueur minimale est de {min}'
      maxLength: 'La longueur maximale est de {max}'
      lowerCase: 'Au moins {count} lettre(s) minuscule(s) requise(s)'
      upperCase: 'Au moins {count} lettre(s) majuscule(s) requise(s)'
      symbol: 'Au moins {count} symbole(s) requis'
      numeric: 'Au moins {count} chiffre(s) requis'
  confirm-password:
    label: 'Confirmer le mot de passe'
    rule:
      identical: 'Les mots de passe ne correspondent pas'
</i18n>

<i18n lang="yaml" locale="pl">
field:
  name:
    label: 'Imię i nazwisko'
    rule:
      required: 'Musisz podać imię i nazwisko'
  email:
    label: 'E-mail'
    rule:
      required: 'Musisz podać prawidłowy adres e-mail'
  password:
    label: 'Hasło'
    rule:
      minLength: 'Minimalna długość to {min}'
      maxLength: 'Maksymalna długość to {max}'
      lowerCase: 'Wymagana co najmniej {count} mała litera'
      upperCase: 'Wymagana co najmniej {count} wielka litera'
      symbol: 'Wymagany co najmniej {count} symbol'
      numeric: 'Wymagana co najmniej {count} cyfra'
  confirm-password:
    label: 'Potwierdź hasło'
    rule:
      identical: 'Hasła nie są identyczne'
</i18n>

<i18n lang="yaml" locale="cs">
field:
  name:
    label: 'Jméno a příjmení'
    rule:
      required: 'Musíte zadat jméno a příjmení'
  email:
    label: 'E-mail'
    rule:
      required: 'Musíte zadat platnou e-mailovou adresu'
  password:
    label: 'Heslo'
    rule:
      minLength: 'Minimální délka je {min}'
      maxLength: 'Maximální délka je {max}'
      lowerCase: 'Je vyžadováno alespoň {count} malé písmeno'
      upperCase: 'Je vyžadováno alespoň {count} velké písmeno'
      symbol: 'Je vyžadován alespoň {count} symbol'
      numeric: 'Je vyžadována alespoň {count} číslice'
  confirm-password:
    label: 'Potvrďte heslo'
    rule:
      identical: 'Hesla se neshodují'
</i18n>
