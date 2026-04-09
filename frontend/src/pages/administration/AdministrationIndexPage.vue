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
    color: 'indigo',
    to: { name: 'administration.users' },
  },
  {
    name: 'camps',
    label: t('camps.label'),
    description: t('camps.description'),
    icon: 'holiday_village',
    color: 'primary',
    to: { name: 'administration.camps' },
  },
  {
    name: 'newsletters',
    label: t('newsletters.label'),
    description: t('newsletters.description'),
    icon: 'mail',
    color: 'teal',
    to: { name: 'administration.newsletters' },
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
</i18n>
