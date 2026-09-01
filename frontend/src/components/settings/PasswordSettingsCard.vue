<template>
  <q-form @submit="onSave">
    <q-card-section>
      <div class="row q-col-gutter-md">
        <q-input
          v-model="data.currentPassword"
          :label="t('field.currentPassword.label')"
          type="password"
          autocomplete="current-password"
          :rules="[
            (val?: string) => !!val || t('field.currentPassword.rule.required'),
          ]"
          hide-bottom-space
          outlined
          rounded
          color="primary"
          class="col-12"
        >
          <template #prepend>
            <q-icon name="password" />
          </template>
        </q-input>

        <q-input
          v-model="data.password"
          :label="t('field.password.label')"
          type="password"
          autocomplete="new-password"
          :rules="[
            (val?: string) => !!val || t('field.password.rule.required'),
            (val: string) =>
              val.length > 7 || t('field.password.rule.minlength'),
          ]"
          lazy-rules
          hide-bottom-space
          outlined
          rounded
          color="primary"
          class="col-12 col-md-6"
        >
          <template #prepend>
            <q-icon name="password" />
          </template>
        </q-input>

        <q-input
          v-model="confirmPassword"
          :label="t('field.confirmPassword.label')"
          type="password"
          autocomplete="new-password"
          :rules="[
            (val?: string) => !!val || t('field.confirmPassword.rule.required'),
            (val: string) =>
              val === data.password || t('field.confirmPassword.rule.match'),
          ]"
          lazy-rules
          hide-bottom-space
          outlined
          rounded
          color="primary"
          class="col-12 col-md-6"
        >
          <template #prepend>
            <q-icon name="password" />
          </template>
        </q-input>
      </div>
    </q-card-section>

    <q-card-actions>
      <m-btn
        :label="t('action.save')"
        type="submit"
        color="primary"
      />
    </q-card-actions>
  </q-form>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { ProfileUpdateData } from '@camp-registration/common/entities';
import { ref } from 'vue';

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'save', data: ProfileUpdateData): void;
}>();

const data = ref({
  password: '',
  currentPassword: '',
});

const confirmPassword = ref<string>();

function onSave() {
  emit('save', data.value);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
field:
  currentPassword:
    label: 'Old Password'
    rule:
      required: 'The password is required.'
  password:
    label: 'New Password'
    rule:
      required: 'The password is required.'
      minlength: 'The password must be at least 8 characters.'
  confirmPassword:
    label: 'Confirm Password'
    rule:
      required: 'The password is required.'
      match: 'The password does not match.'

action:
  save: 'Update password'
</i18n>

<i18n lang="yaml" locale="de">
field:
  currentPassword:
    label: 'Altes Passwort'
    rule:
      required: 'Das Passwort ist erforderlich.'
  password:
    label: 'Neues Passwort'
    rule:
      required: 'Das Passwort ist erforderlich.'
      minlength: 'Das Passwort muss mindestens 8 Zeichen lang sein.'
  confirmPassword:
    label: 'Passwort bestätigen'
    rule:
      required: 'Das Passwort ist erforderlich.'
      match: 'Die Passwörter stimmen nicht überein.'

action:
  save: 'Passwort aktualisieren'
</i18n>

<i18n lang="yaml" locale="fr">
field:
  currentPassword:
    label: 'Ancien mot de passe'
    rule:
      required: 'Le mot de passe est obligatoire.'
  password:
    label: 'Nouveau mot de passe'
    rule:
      required: 'Le mot de passe est obligatoire.'
      minlength: 'Le mot de passe doit contenir au moins 8 caractères.'
  confirmPassword:
    label: 'Confirmer le mot de passe'
    rule:
      required: 'Le mot de passe est obligatoire.'
      match: 'Les mots de passe ne correspondent pas.'

action:
  save: 'Mettre à jour le mot de passe'
</i18n>

<i18n lang="yaml" locale="pl">
field:
  currentPassword:
    label: 'Stare hasło'
    rule:
      required: 'Hasło jest wymagane.'
  password:
    label: 'Nowe hasło'
    rule:
      required: 'Hasło jest wymagane.'
      minlength: 'Hasło musi mieć co najmniej 8 znaków.'
  confirmPassword:
    label: 'Potwierdź hasło'
    rule:
      required: 'Hasło jest wymagane.'
      match: 'Hasła nie są zgodne.'

action:
  save: 'Zaktualizuj hasło'
</i18n>

<i18n lang="yaml" locale="cs">
field:
  currentPassword:
    label: 'Staré heslo'
    rule:
      required: 'Heslo je povinné.'
  password:
    label: 'Nové heslo'
    rule:
      required: 'Heslo je povinné.'
      minlength: 'Heslo musí mít alespoň 8 znaků.'
  confirmPassword:
    label: 'Potvrďte heslo'
    rule:
      required: 'Heslo je povinné.'
      match: 'Hesla se neshodují.'

action:
  save: 'Aktualizovat heslo'
</i18n>
