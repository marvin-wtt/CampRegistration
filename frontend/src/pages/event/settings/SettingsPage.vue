<template>
  <page-state-handler
    padding
    :error="eventError"
    class="settings-page row justify-center"
  >
    <div
      class="col-12 col-sm-10 col-md-8 col-lg-6 column no-wrap q-gutter-y-lg"
    >
      <page-header
        :title="t('title')"
        :subtitle="t('subtitle')"
      >
        <q-skeleton
          v-if="loading"
          type="QChip"
          width="160px"
          class="q-mt-sm"
        />
        <owning-organization-chip
          v-else-if="event"
          class="q-mt-sm"
          subject="event"
          :organization-id="event.organizationId"
          :organization-name="event.organizationName"
          :verification-status="event.organizationVerificationStatus"
        />
      </page-header>

      <q-list
        v-if="loading"
        bordered
        separator
        class="rounded-borders overflow-hidden"
      >
        <q-item
          v-for="width in ['45%', '60%', '35%', '55%', '40%']"
          :key="width"
          class="q-py-md"
        >
          <q-item-section avatar>
            <q-skeleton type="QAvatar" />
          </q-item-section>

          <q-item-section>
            <q-skeleton
              type="text"
              width="30%"
            />
            <q-skeleton
              type="text"
              :width="width"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <q-list
        v-else
        bordered
        separator
        class="rounded-borders overflow-hidden"
      >
        <q-item
          v-for="item in filteredItems"
          :key="item.name"
          :to="{ name: item.routeName }"
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
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageHeader from '@/components/common/PageHeader.vue';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventRouteAccess } from '@/composables/permissions';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile-store';
import OwningOrganizationChip from '@/components/common/OwningOrganizationChip.vue';

const { t } = useI18n();
const { canAccessRoute } = useEventRouteAccess();
const profileStore = useProfileStore();
const { data: event, error: eventError } = storeToRefs(useEventDetailsStore());

// The items depend on permissions (profile and event). The layout starts the
// event fetch after this page's first render, so `isLoading` isn't set yet.
const loading = computed<boolean>(
  () =>
    profileStore.user === undefined ||
    (event.value === undefined && !eventError.value),
);

interface SettingsItem {
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  routeName: string;
}

const items = computed<SettingsItem[]>(() => [
  {
    name: 'edit',
    label: t('edit.label'),
    description: t('edit.description'),
    icon: 'edit',
    color: 'primary',
    routeName: 'management.event.settings.edit',
  },
  {
    name: 'form',
    label: t('form.label'),
    description: t('form.description'),
    icon: 'feed',
    color: 'primary',
    routeName: 'management.event.settings.form',
  },
  {
    name: 'access',
    label: t('access.label'),
    description: t('access.description'),
    icon: 'key',
    color: 'tertiary',
    routeName: 'management.event.settings.access',
  },
  {
    name: 'emails',
    label: t('emails.label'),
    description: t('emails.description'),
    icon: 'email',
    color: 'secondary',
    routeName: 'management.event.settings.emails',
  },
  {
    name: 'files',
    label: t('files.label'),
    description: t('files.description'),
    icon: 'folder',
    color: 'secondary',
    routeName: 'management.event.settings.files',
  },
  {
    name: 'privacy',
    label: t('privacy.label'),
    description: t('privacy.description'),
    icon: 'privacy_tip',
    color: 'tertiary',
    routeName: 'management.event.settings.privacy',
  },
  {
    name: 'navigation',
    label: t('navigation.label'),
    description: t('navigation.description'),
    icon: 'visibility',
    color: 'primary',
    routeName: 'management.event.settings.navigation',
  },
  {
    name: 'audit',
    label: t('audit.label'),
    description: t('audit.description'),
    icon: 'history',
    color: 'tertiary',
    routeName: 'management.event.settings.audit',
  },
]);

const filteredItems = computed<SettingsItem[]>(() => {
  return items.value.filter((item) => canAccessRoute(item.routeName));
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
navigation:
  label: 'Navigation'
  description: "Choose which features appear in this event's navigation and dashboard."
emails:
  label: 'Automated emails'
  description: 'Emails sent automatically to participants when their registration changes.'
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
navigation:
  label: 'Navigation'
  description: 'Wähle aus, welche Funktionen in der Navigation und im Dashboard dieser Veranstaltung angezeigt werden.'
emails:
  label: 'Automatische E-Mails'
  description: 'E-Mails, die Teilnehmenden bei Änderungen ihrer Anmeldung automatisch gesendet werden.'
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
navigation:
  label: 'Navigation'
  description: 'Choisissez les fonctionnalités affichées dans la navigation et le tableau de bord de cet événement.'
emails:
  label: 'E-mails automatiques'
  description: 'E-mails envoyés automatiquement aux participants lorsque leur inscription change.'
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
navigation:
  label: 'Nawigacja'
  description: 'Wybierz funkcje widoczne w nawigacji i na pulpicie tego wydarzenia.'
emails:
  label: 'Automatyczne e-maile'
  description: 'E-maile wysyłane automatycznie uczestnikom przy zmianie ich rejestracji.'
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
navigation:
  label: 'Navigace'
  description: 'Vyberte, které funkce se zobrazí v navigaci a na přehledu této akce.'
emails:
  label: 'Automatické e-maily'
  description: 'E-maily automaticky odesílané účastníkům při změně jejich registrace.'
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
