<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-form
        @submit="onSubmit"
        @reset="onDialogCancel"
      >
        <q-card-section class="text-h6">
          {{ isEdit ? t('title.edit') : t('title.add') }}
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-md">
          <q-input
            v-if="!isEdit"
            v-model="email"
            :label="t('input.email.label')"
            :hint="t('input.email.hint')"
            type="email"
            :rules="[(val?: string) => !!val || t('input.email.rule.required')]"
            hide-bottom-space
            autofocus
            rounded
            outlined
          />
          <caption-select
            v-model="role"
            :label="t('input.role.label')"
            :options="roleOptions"
            rounded
            outlined
          />
        </q-card-section>

        <q-card-actions
          align="right"
          class="text-primary"
        >
          <q-btn
            :label="t('action.cancel')"
            type="reset"
            flat
            outline
            rounded
          />
          <q-btn
            :label="isEdit ? t('action.save') : t('action.add')"
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
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import type {
  OrganizationMember,
  OrganizationRole,
} from '@camp-registration/common/entities';
import CaptionSelect, {
  type CaptionSelectOption,
} from '@/components/common/inputs/CaptionSelect.vue';

const props = defineProps<{ member?: OrganizationMember }>();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
defineEmits([...useDialogPluginComponent.emits]);

const isEdit = computed(() => props.member !== undefined);

const email = ref<string>(props.member?.email ?? '');
const role = ref<OrganizationRole>(props.member?.role ?? 'MEMBER');

const roleOptions = computed<CaptionSelectOption<OrganizationRole>[]>(() => [
  {
    label: t('role.ADMIN.label'),
    caption: t('role.ADMIN.caption'),
    value: 'ADMIN',
  },
  {
    label: t('role.MEMBER.label'),
    caption: t('role.MEMBER.caption'),
    value: 'MEMBER',
  },
]);

function onSubmit() {
  onDialogOK(
    isEdit.value
      ? { role: role.value }
      : { email: email.value, role: role.value },
  );
}
</script>

<i18n lang="yaml" locale="en">
title:
  add: 'Add member'
  edit: 'Change role'
role:
  ADMIN:
    label: 'Admin'
    caption: 'Manages the organization, its events and members'
  MEMBER:
    label: 'Member'
    caption: 'May create events under the organization'
input:
  email:
    label: 'Email address'
    hint: 'If they have no account yet, they will be added once they register'
    rule:
      required: 'Email address is required'
  role:
    label: 'Role'
action:
  add: 'Add'
  save: 'Save'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title:
  add: 'Mitglied hinzufügen'
  edit: 'Rolle ändern'
role:
  ADMIN:
    label: 'Admin'
    caption: 'Verwaltet Organisation, Veranstaltungen und Mitglieder'
  MEMBER:
    label: 'Mitglied'
    caption: 'Darf Veranstaltungen der Organisation anlegen'
input:
  email:
    label: 'E-Mail-Adresse'
    hint: 'Ohne Konto wird die Person nach der Registrierung hinzugefügt'
    rule:
      required: 'E-Mail-Adresse ist erforderlich'
  role:
    label: 'Rolle'
action:
  add: 'Hinzufügen'
  save: 'Speichern'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  add: 'Ajouter un membre'
  edit: 'Changer le rôle'
role:
  ADMIN:
    label: 'Admin'
    caption: "Gère l'organisation, ses événements et ses membres"
  MEMBER:
    label: 'Membre'
    caption: "Peut créer des événements pour l'organisation"
input:
  email:
    label: 'Adresse e-mail'
    hint: 'Sans compte, la personne sera ajoutée après son inscription'
    rule:
      required: "L'adresse e-mail est requise"
  role:
    label: 'Rôle'
action:
  add: 'Ajouter'
  save: 'Enregistrer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  add: 'Dodaj członka'
  edit: 'Zmień rolę'
role:
  ADMIN:
    label: 'Administrator'
    caption: 'Zarządza organizacją, wydarzeniami i członkami'
  MEMBER:
    label: 'Członek'
    caption: 'Może tworzyć wydarzenia w organizacji'
input:
  email:
    label: 'Adres e-mail'
    hint: 'Bez konta osoba zostanie dodana po rejestracji'
    rule:
      required: 'Adres e-mail jest wymagany'
  role:
    label: 'Rola'
action:
  add: 'Dodaj'
  save: 'Zapisz'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  add: 'Přidat člena'
  edit: 'Změnit roli'
role:
  ADMIN:
    label: 'Správce'
    caption: 'Spravuje organizaci, akce a členy'
  MEMBER:
    label: 'Člen'
    caption: 'Může vytvářet akce organizace'
input:
  email:
    label: 'E-mailová adresa'
    hint: 'Bez účtu bude osoba přidána po registraci'
    rule:
      required: 'E-mailová adresa je povinná'
  role:
    label: 'Role'
action:
  add: 'Přidat'
  save: 'Uložit'
  cancel: 'Zrušit'
</i18n>
