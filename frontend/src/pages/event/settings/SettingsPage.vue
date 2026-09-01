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
        <owning-organization-chip
          v-if="event"
          class="q-mt-sm"
          subject="event"
          :organization-id="event.organizationId"
          :organization-name="event.organizationName"
          :verification-status="event.organizationVerificationStatus"
        />
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
import { usePermissions } from '@/composables/permissions';
import type { PermissionRequirement } from '@/composables/scopePermissions';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { storeToRefs } from 'pinia';
import OwningOrganizationChip from '@/components/common/OwningOrganizationChip.vue';

const { t } = useI18n();
const { canAccess } = usePermissions();
const { data: event } = storeToRefs(useEventDetailsStore());

interface SettingsItem {
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  to: RouteLocationRaw;
  permission?: PermissionRequirement<'event'>;
}

const items = computed<SettingsItem[]>(() => [
  {
    name: 'edit',
    label: t('edit.label'),
    description: t('edit.description'),
    icon: 'edit',
    color: 'primary',
    to: { name: 'management.event.settings.edit' },
    permission: 'event.edit',
  },
  {
    name: 'form',
    label: t('form.label'),
    description: t('form.description'),
    icon: 'feed',
    color: 'primary',
    to: { name: 'management.event.settings.form' },
    permission: { all: ['event.edit', 'event.files.view'] },
  },
  {
    name: 'access',
    label: t('access.label'),
    description: t('access.description'),
    icon: 'key',
    color: 'tertiary',
    to: { name: 'management.event.settings.access' },
    permission: 'event.managers.view',
  },
  {
    name: 'emails',
    label: t('emails.label'),
    description: t('emails.description'),
    icon: 'email',
    color: 'accent',
    to: { name: 'management.event.settings.emails' },
    permission: 'event.message_templates.view',
  },
  {
    name: 'files',
    label: t('files.label'),
    description: t('files.description'),
    icon: 'folder',
    color: 'accent',
    to: { name: 'management.event.settings.files' },
    permission: 'event.files.view',
  },
  {
    name: 'privacy',
    label: t('privacy.label'),
    description: t('privacy.description'),
    icon: 'privacy_tip',
    color: 'tertiary',
    to: { name: 'management.event.settings.privacy' },
    permission: 'event.edit',
  },
  {
    name: 'audit',
    label: t('audit.label'),
    description: t('audit.description'),
    icon: 'history',
    color: 'tertiary',
    to: { name: 'management.event.settings.audit' },
    permission: 'event.audit.view',
  },
]);

const filteredItems = computed<SettingsItem[]>(() => {
  return items.value.filter((item) => canAccess(item.permission));
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
subtitle: 'Configure your event.'
access:
  label: 'Access'
  description: 'Manage who can view and edit this event.'
edit:
  label: 'Edit'
  description: 'Edit the general details of this event.'
form:
  label: 'Registration Form'
  description: 'Design and customize the registration form and theme.'
emails:
  label: 'Email templates'
  description: 'Manage the email templates sent to participants.'
files:
  label: 'Files'
  description: 'Upload and manage files for this event.'
privacy:
  label: 'Privacy'
  description: 'What this event adds to the privacy information of its organisation.'
audit:
  label: 'Audit Log'
  description: 'Review the history of changes made to this event.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Einstellungen'
subtitle: 'Konfiguriere deine Veranstaltung.'
access:
  label: 'Zugriff'
  description: 'Verwalte, wer diese Veranstaltung ansehen und bearbeiten kann.'
edit:
  label: 'Bearbeiten'
  description: 'Bearbeite die allgemeinen Angaben dieser Veranstaltung.'
form:
  label: 'Anmeldeformular'
  description: 'Gestalte und passe das Anmeldeformular und das Design an.'
emails:
  label: 'E-Mail-Vorlagen'
  description: 'Verwalte die an Teilnehmende versendeten E-Mail-Vorlagen.'
files:
  label: 'Dateien'
  description: 'Lade Dateien für diese Veranstaltung hoch und verwalte sie.'
privacy:
  label: 'Datenschutz'
  description: 'Was diese Freizeit den Datenschutzinformationen ihrer Organisation hinzufügt.'
audit:
  label: 'Aktivitätsprotokoll'
  description: 'Sieh dir den Änderungsverlauf dieser Veranstaltung an.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Paramètres'
subtitle: 'Configurez votre événement.'
access:
  label: 'Accès'
  description: 'Gérez qui peut consulter et modifier cet événement.'
edit:
  label: 'Modifier'
  description: 'Modifiez les informations générales de cet événement.'
form:
  label: "Formulaire d'inscription"
  description: "Concevez et personnalisez le formulaire d'inscription et le thème."
emails:
  label: "Modèles d'e-mails"
  description: "Gérez les modèles d'e-mails envoyés aux participants."
files:
  label: 'Fichiers'
  description: 'Téléchargez et gérez les fichiers de cet événement.'
privacy:
  label: 'Confidentialité'
  description: 'Ce que ce séjour ajoute aux informations de son organisation.'
audit:
  label: 'Journal d’activité'
  description: 'Consultez l’historique des modifications apportées à cet événement.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Ustawienia'
subtitle: 'Skonfiguruj swoje wydarzenie.'
access:
  label: 'Dostęp'
  description: 'Zarządzaj tym, kto może przeglądać i edytować ten wydarzenie.'
edit:
  label: 'Edytuj'
  description: 'Edytuj ogólne dane tego wydarzenia.'
form:
  label: 'Formularz rejestracyjny'
  description: 'Zaprojektuj i dostosuj formularz rejestracyjny i motyw.'
emails:
  label: 'Szablony e-maili'
  description: 'Zarządzaj szablonami e-maili wysyłanymi do uczestników.'
files:
  label: 'Pliki'
  description: 'Przesyłaj pliki dla tego wydarzenia i zarządzaj nimi.'
privacy:
  label: 'Prywatność'
  description: 'Co ten wydarzenie dodaje do informacji swojej organizacji.'
audit:
  label: 'Dziennik aktywności'
  description: 'Przejrzyj historię zmian wprowadzonych w tym wydarzeniu.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Nastavení'
subtitle: 'Nakonfigurujte svou akci.'
access:
  label: 'Přístup'
  description: 'Spravujte, kdo může tuto akci zobrazit a upravovat.'
edit:
  label: 'Upravit'
  description: 'Upravte obecné údaje této akce.'
form:
  label: 'Registrační formulář'
  description: 'Navrhněte a přizpůsobte registrační formulář a vzhled.'
emails:
  label: 'E-mailové šablony'
  description: 'Spravujte e-mailové šablony zasílané účastníkům.'
files:
  label: 'Soubory'
  description: 'Nahrávejte a spravujte soubory pro tuto akci.'
privacy:
  label: 'Soukromí'
  description: 'Co tato akce doplňuje k informacím své organizace.'
audit:
  label: 'Deník aktivit'
  description: 'Prohlédněte si historii změn této akce.'
</i18n>
