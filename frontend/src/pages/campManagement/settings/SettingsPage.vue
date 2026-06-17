<template>
  <q-page
    padding
    class="settings-page row justify-center"
  >
    <div class="col-12 col-sm-10 col-md-8 col-lg-6 column q-gutter-y-lg">
      <div class="page-title">
        <div class="text-h5 text-weight-medium">
          {{ t('title') }}
        </div>
        <div class="text-body2 text-grey-6 q-mt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <q-list
        bordered
        separator
        class="rounded-borders overflow-hidden"
      >
        <q-item
          v-for="item in filteredItems"
          :key="item.name"
          :to="item.to"
          v-ripple
          clickable
          class="q-py-md"
        >
          <q-item-section avatar>
            <q-avatar
              :color="item.color"
              text-color="white"
              :icon="item.icon"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ item.label }}
            </q-item-label>
            <q-item-label caption>
              {{ item.description }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-icon
              name="chevron_right"
              color="grey-5"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { type RouteLocationRaw } from 'vue-router';
import { usePermissions } from 'src/composables/permissions';
import type { Permission } from '@camp-registration/common/permissions';

const { t } = useI18n();
const { can } = usePermissions();

interface SettingsItem {
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  to: RouteLocationRaw;
  permission?: Permission;
}

const items = computed<SettingsItem[]>(() => [
  {
    name: 'edit',
    label: t('edit.label'),
    description: t('edit.description'),
    icon: 'edit',
    color: 'primary',
    to: { name: 'management.camp.settings.edit' },
    permission: 'camp.edit',
  },
  {
    name: 'form',
    label: t('form.label'),
    description: t('form.description'),
    icon: 'feed',
    color: 'primary',
    to: { name: 'management.camp.settings.form' },
    permission: 'camp.edit',
  },
  {
    name: 'access',
    label: t('access.label'),
    description: t('access.description'),
    icon: 'key',
    color: 'tertiary',
    to: { name: 'management.camp.settings.access' },
    permission: 'camp.managers.view',
  },
  {
    name: 'emails',
    label: t('emails.label'),
    description: t('emails.description'),
    icon: 'email',
    color: 'accent',
    to: { name: 'management.camp.settings.emails' },
    permission: 'camp.message_templates.view',
  },
  {
    name: 'files',
    label: t('files.label'),
    description: t('files.description'),
    icon: 'folder',
    color: 'accent',
    to: { name: 'management.camp.settings.files' },
    permission: 'camp.files.view',
  },
]);

const filteredItems = computed<SettingsItem[]>(() => {
  return items.value.filter((item) => !item.permission || can(item.permission));
});
</script>

<style scoped>
/* The default page padding feels cramped under the app bar on phones. */
@media (max-width: 599px) {
  .settings-page {
    padding-top: 24px;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Settings'
subtitle: 'Configure your camp.'
access:
  label: 'Access'
  description: 'Manage who can view and edit this camp.'
edit:
  label: 'Edit'
  description: 'Edit the general details of this camp.'
form:
  label: 'Registration Form'
  description: 'Design and customize the registration form and theme.'
emails:
  label: 'Email templates'
  description: 'Manage the email templates sent to participants.'
files:
  label: 'Files'
  description: 'Upload and manage files for this camp.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Einstellungen'
subtitle: 'Konfiguriere dein Camp.'
access:
  label: 'Zugriff'
  description: 'Verwalte, wer dieses Camp ansehen und bearbeiten kann.'
edit:
  label: 'Bearbeiten'
  description: 'Bearbeite die allgemeinen Angaben dieses Camps.'
form:
  label: 'Anmeldeformular'
  description: 'Gestalte und passe das Anmeldeformular und das Design an.'
emails:
  label: 'E-Mail-Vorlagen'
  description: 'Verwalte die an Teilnehmende versendeten E-Mail-Vorlagen.'
files:
  label: 'Dateien'
  description: 'Lade Dateien für dieses Camp hoch und verwalte sie.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Paramètres'
subtitle: 'Configurez votre camp.'
access:
  label: 'Accès'
  description: 'Gérez qui peut consulter et modifier ce camp.'
edit:
  label: 'Modifier'
  description: 'Modifiez les informations générales de ce camp.'
form:
  label: "Formulaire d'inscription"
  description: "Concevez et personnalisez le formulaire d'inscription et le thème."
emails:
  label: "Modèles d'e-mails"
  description: "Gérez les modèles d'e-mails envoyés aux participants."
files:
  label: 'Fichiers'
  description: 'Téléchargez et gérez les fichiers de ce camp.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Ustawienia'
subtitle: 'Skonfiguruj swój obóz.'
access:
  label: 'Dostęp'
  description: 'Zarządzaj tym, kto może przeglądać i edytować ten obóz.'
edit:
  label: 'Edytuj'
  description: 'Edytuj ogólne dane tego obozu.'
form:
  label: 'Formularz rejestracyjny'
  description: 'Zaprojektuj i dostosuj formularz rejestracyjny i motyw.'
emails:
  label: 'Szablony e-maili'
  description: 'Zarządzaj szablonami e-maili wysyłanymi do uczestników.'
files:
  label: 'Pliki'
  description: 'Przesyłaj pliki dla tego obozu i zarządzaj nimi.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Nastavení'
subtitle: 'Nakonfigurujte svůj tábor.'
access:
  label: 'Přístup'
  description: 'Spravujte, kdo může tento tábor zobrazit a upravovat.'
edit:
  label: 'Upravit'
  description: 'Upravte obecné údaje tohoto tábora.'
form:
  label: 'Registrační formulář'
  description: 'Navrhněte a přizpůsobte registrační formulář a vzhled.'
emails:
  label: 'E-mailové šablony'
  description: 'Spravujte e-mailové šablony zasílané účastníkům.'
files:
  label: 'Soubory'
  description: 'Nahrávejte a spravujte soubory pro tento tábor.'
</i18n>
