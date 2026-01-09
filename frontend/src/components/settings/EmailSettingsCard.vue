<template>
  <q-card flat>
    <q-form
      @submit="onSave"
      @reset="onReset"
    >
      <q-card-section class="text-h4">
        {{ t('title') }}
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <q-input
          v-model="data.email"
          :label="t('field.email.label')"
          type="email"
          autocomplete="email"
          :rules="[(val?: string) => !!val || t('field.email.rule.required')]"
          hide-bottom-space
          outlined
          rounded
          class="settings-input"
        >
          <template #before>
            <q-icon name="email" />
          </template>
        </q-input>

        <q-input
          v-model="confirmEamil"
          :label="t('field.confirmEmail.label')"
          type="email"
          autocomplete="email"
          :rules="[
            (val?: string) => !!val || t('field.confirmEmail.rule.required'),
            (val: string) =>
              val === data.email || t('field.confirmEmail.rule.match'),
          ]"
          hide-bottom-space
          outlined
          rounded
          class="settings-input"
        >
          <template #before>
            <q-icon name="email" />
          </template>
        </q-input>

        <q-input
          v-model="data.currentPassword"
          :label="t('field.password.label')"
          type="password"
          autocomplete="current-password"
          :rules="[
            (val?: string) => !!val || t('field.password.rule.required'),
          ]"
          hide-bottom-space
          outlined
          rounded
          class="settings-input"
        >
          <template #before>
            <q-icon name="password" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-actions>
        <q-btn
          :label="t('action.save')"
          type="submit"
          color="primary"
          outlined
          rounded
        />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type {
  Profile,
  ProfileUpdateData,
} from '@camp-registration/common/entities';
import { ref } from 'vue';

const { t } = useI18n();

const { profile } = defineProps<{
  profile: Profile;
}>();

const emit = defineEmits<{
  (e: 'save', data: ProfileUpdateData): void;
}>();

const data = ref({
  email: profile.email,
  currentPassword: '',
});

const confirmEamil = ref<string>();

function onSave() {
  emit('save', data.value);
}

function onReset() {
  data.value = {
    email: profile.email,
    currentPassword: '',
  };
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'E-Mail'

field:
  confirmEmail:
    label: 'Confirm E-Mail'
    rule:
      required: 'The e-mail is required.'
      match: 'The e-mail does not match.'
  email:
    label: 'E-Mail'
    rule:
      required: 'The e-mail is required.'
  password:
    label: 'Current Password'
    rule:
      required: 'The password is required.'

action:
  save: 'Update email'
</i18n>

<i18n lang="yaml" locale="de">
title: 'E-Mail'

field:
  confirmEmail:
    label: 'E-Mail bestätigen'
    rule:
      required: 'Die E-Mail ist erforderlich.'
      match: 'Die E-Mail-Adressen stimmen nicht überein.'
  email:
    label: 'E-Mail'
    rule:
      required: 'Die E-Mail ist erforderlich.'
  password:
    label: 'Aktuelles Passwort'
    rule:
      required: 'Das Passwort ist erforderlich.'

action:
  save: 'E-Mail aktualisieren'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'E-mail'

field:
  confirmEmail:
    label: 'Confirmer l’e-mail'
    rule:
      required: 'L’e-mail est obligatoire.'
      match: 'Les e-mails ne correspondent pas.'
  email:
    label: 'E-mail'
    rule:
      required: 'L’e-mail est obligatoire.'
  password:
    label: 'Mot de passe actuel'
    rule:
      required: 'Le mot de passe est obligatoire.'

action:
  save: 'Mettre à jour l’e-mail'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'E-mail'

field:
  confirmEmail:
    label: 'Potwierdź e-mail'
    rule:
      required: 'Adres e-mail jest wymagany.'
      match: 'Adresy e-mail nie są zgodne.'
  email:
    label: 'E-mail'
    rule:
      required: 'Adres e-mail jest wymagany.'
  password:
    label: 'Aktualne hasło'
    rule:
      required: 'Hasło jest wymagane.'

action:
  save: 'Zaktualizuj e-mail'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'E-mail'

field:
  confirmEmail:
    label: 'Potvrďte e-mail'
    rule:
      required: 'E-mail je povinný.'
      match: 'E-mailové adresy se neshodují.'
  email:
    label: 'E-mail'
    rule:
      required: 'E-mail je povinný.'
  password:
    label: 'Aktuální heslo'
    rule:
      required: 'Heslo je povinné.'

action:
  save: 'Aktualizovat e-mail'
</i18n>
