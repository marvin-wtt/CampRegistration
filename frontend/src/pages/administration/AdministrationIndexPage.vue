<template>
  <q-page
    padding
    class="row justify-center"
  >
    <div class="col-12 col-sm-10 col-md-8 col-lg-6 column q-gutter-y-lg">
      <div>
        <div class="text-h5 text-weight-medium">{{ t('title') }}</div>
        <div class="text-body2 text-grey-6 q-mt-xs">{{ t('subtitle') }}</div>
      </div>

      <q-list
        bordered
        separator
        class="rounded-borders overflow-hidden"
      >
        <q-item
          v-for="item in items"
          :key="item.name"
          v-ripple
          clickable
          class="q-py-md"
          @click="router.push(item.to)"
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
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();

const items = [
  {
    name: 'users',
    label: t('users.label'),
    description: t('users.description'),
    icon: 'people',
    color: 'primary',
    to: { name: 'administration.users' },
  },
  {
    name: 'camps',
    label: t('camps.label'),
    description: t('camps.description'),
    icon: 'holiday_village',
    color: 'secondary',
    to: { name: 'administration.camps' },
  },
  {
    name: 'newsletters',
    label: t('newsletters.label'),
    description: t('newsletters.description'),
    icon: 'mail',
    color: 'tertiary',
    to: { name: 'administration.newsletters' },
  },
  {
    name: 'queues',
    label: t('queues.label'),
    description: t('queues.description'),
    icon: 'queue',
    color: 'info',
    to: { name: 'administration.queues' },
  },
  {
    name: 'legal',
    label: t('legal.label'),
    description: t('legal.description'),
    icon: 'gavel',
    color: 'primary',
    to: { name: 'administration.legal' },
  },
] as const;
</script>

<i18n lang="yaml" locale="en">
title: 'Administration'
subtitle: 'Select a section to manage.'
users:
  label: 'Users'
  description: 'Manage user accounts, roles, and permissions.'
camps:
  label: 'Camps'
  description: 'View and manage all camps across the platform.'
newsletters:
  label: 'Newsletters'
  description: 'Manage newsletter lists and subscriber imports.'
queues:
  label: 'Queues'
  description: 'Monitor background jobs, retry or delete failed jobs.'
legal:
  label: 'Legal Content'
  description: 'Manage the Imprint and Privacy Policy shown to visitors.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Administration'
subtitle: 'Wähle einen Bereich zur Verwaltung.'
users:
  label: 'Benutzer'
  description: 'Benutzerkonten, Rollen und Berechtigungen verwalten.'
camps:
  label: 'Camps'
  description: 'Alle Camps der Plattform einsehen und verwalten.'
newsletters:
  label: 'Newsletter'
  description: 'Newsletter-Listen und Abonnenten-Importe verwalten.'
queues:
  label: 'Warteschlangen'
  description: 'Hintergrundjobs überwachen, fehlgeschlagene Jobs wiederholen oder löschen.'
legal:
  label: 'Rechtliche Inhalte'
  description: 'Impressum und Datenschutzerklärung für Besucher verwalten.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Administration'
subtitle: 'Sélectionnez une section à gérer.'
users:
  label: 'Utilisateurs'
  description: 'Gérer les comptes utilisateurs, les rôles et les permissions.'
camps:
  label: 'Camps'
  description: 'Consulter et gérer tous les camps de la plateforme.'
newsletters:
  label: 'Newsletters'
  description: "Gérer les listes de newsletters et les importations d'abonnés."
queues:
  label: "Files d'attente"
  description: 'Surveiller les tâches en arrière-plan, relancer ou supprimer les tâches échouées.'
legal:
  label: 'Contenu légal'
  description: 'Gérer les mentions légales et la politique de confidentialité affichées aux visiteurs.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Administracja'
subtitle: 'Wybierz sekcję do zarządzania.'
users:
  label: 'Użytkownicy'
  description: 'Zarządzaj kontami użytkowników, rolami i uprawnieniami.'
camps:
  label: 'Obozy'
  description: 'Przeglądaj i zarządzaj wszystkimi obozami na platformie.'
newsletters:
  label: 'Newslettery'
  description: 'Zarządzaj listami newsletterów i importami subskrybentów.'
queues:
  label: 'Kolejki'
  description: 'Monitoruj zadania w tle, ponawiaj lub usuwaj nieudane zadania.'
legal:
  label: 'Treści prawne'
  description: 'Zarządzaj notą prawną i polityką prywatności widoczną dla odwiedzających.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Administrace'
subtitle: 'Vyberte sekci ke správě.'
users:
  label: 'Uživatelé'
  description: 'Spravujte uživatelské účty, role a oprávnění.'
camps:
  label: 'Tábory'
  description: 'Prohlížejte a spravujte všechny tábory na platformě.'
newsletters:
  label: 'Newslettery'
  description: 'Spravujte seznamy newsletterů a importy odběratelů.'
queues:
  label: 'Fronty'
  description: 'Sledujte úlohy na pozadí, opakujte nebo mažte neúspěšné úlohy.'
legal:
  label: 'Právní obsah'
  description: 'Spravujte tiráž a zásady ochrany osobních údajů zobrazované návštěvníkům.'
</i18n>
