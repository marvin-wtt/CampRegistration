<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-form
        @submit="onOKClick"
        @reset="onDialogCancel"
      >
        <q-card-section class="text-h4 text-center">
          {{ t('title') }}
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="data.name"
            :label="t('input.name.label')"
            :rules="[
              (val: string) => val.length > 0 || t('input.name.rule.required'),
            ]"
            outlined
            rounded
          >
            <template #before>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="data.email"
            :label="t('input.email.label')"
            type="email"
            :rules="[
              (val: string) => val.length > 0 || t('input.email.rule.required'),
            ]"
            outlined
            rounded
          >
            <template #before>
              <q-icon name="mail" />
            </template>
          </q-input>

          <q-input
            v-model="data.locale"
            :label="t('input.locale.label')"
            mask="aa-AA"
            maxlength="5"
            :rules="[
              (val: string) =>
                val.length === 5 || t('input.locale.rule.required'),
            ]"
            outlined
            rounded
          >
            <template #before>
              <q-icon name="language" />
            </template>
          </q-input>

          <q-select
            v-model="data.role"
            :label="t('input.role.label')"
            :options="roleOptions"
            emit-value
            map-options
            outlined
            rounded
          >
            <template #before>
              <q-icon name="label" />
            </template>
          </q-select>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            :label="t('action.cancel')"
            type="reset"
            color="primary"
            rounded
            outline
          />
          <q-btn
            :label="t('action.ok')"
            type="submit"
            color="primary"
            rounded
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { QForm, type QSelectOption, useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import type { User, UserUpdateData } from '@camp-registration/common/entities';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

const props = defineProps<{
  user: User;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const data = ref<UserUpdateData>({
  email: props.user.email,
  name: props.user.name,
  locale: props.user.locale,
  locked: props.user.locked,
  role: props.user.role,
});

const roleOptions = ref<QSelectOption[]>([
  {
    label: t('input.role.option.user'),
    value: 'USER',
  },
  {
    label: t('input.role.option.admin'),
    value: 'ADMIN',
  },
]);

async function onOKClick() {
  onDialogOK(data.value);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Update user'

action:
  cancel: 'Cancel'
  ok: 'Save'

input:
  email:
    label: 'Email'
    rule:
      required: 'Email is required'
  name:
    label: 'Name'
    rule:
      required: 'Name is required'
  locale:
    label: 'Locale'
    rule:
      required: 'Locale is required'
  password:
    label: 'Password'
    required: 'Password is required'
  role:
    label: 'Role'
    option:
      user: 'User'
      admin: 'Admin'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Benutzer aktualisieren'

action:
  cancel: 'Abbrechen'
  ok: 'Speichern'

input:
  email:
    label: 'E-Mail'
    rule:
      required: 'E-Mail ist erforderlich'
  name:
    label: 'Name'
    rule:
      required: 'Name ist erforderlich'
  locale:
    label: 'Sprache'
    rule:
      required: 'Sprache ist erforderlich'
  password:
    label: 'Passwort'
    required: 'Passwort ist erforderlich'
  role:
    label: 'Rolle'
    option:
      user: 'Benutzer'
      admin: 'Administrator'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Mettre à jour l’utilisateur'

action:
  cancel: 'Annuler'
  ok: 'Enregistrer'

input:
  email:
    label: 'E-mail'
    rule:
      required: 'L’e-mail est requis'
  name:
    label: 'Nom'
    rule:
      required: 'Le nom est requis'
  locale:
    label: 'Langue'
    rule:
      required: 'La langue est requise'
  password:
    label: 'Mot de passe'
    required: 'Le mot de passe est requis'
  role:
    label: 'Rôle'
    option:
      user: 'Utilisateur'
      admin: 'Administrateur'
</i18n>
