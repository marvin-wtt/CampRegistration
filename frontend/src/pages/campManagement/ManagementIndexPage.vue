<template>
  <q-page
    padding
    class="row justify-center"
  >
    <div class="col-12 col-sm-10 col-md-8 col-lg-6 column q-gutter-y-lg">
      <div class="page-title">
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
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t } = useI18n();

const items = computed(() => [
  {
    name: 'camps',
    label: t('camps.label'),
    description: t('camps.description'),
    icon: 'holiday_village',
    color: 'primary',
    to: { name: 'management.camps' },
  },
  {
    name: 'newsletters',
    label: t('newsletters.label'),
    description: t('newsletters.description'),
    icon: 'mail',
    color: 'tertiary',
    to: { name: 'management.newsletters' },
  },
]);
</script>

<i18n lang="yaml" locale="en">
title: 'Management'
subtitle: 'Select a section to get started.'
camps:
  label: 'Camps'
  description: 'View registrations, manage participants, and configure camp settings.'
newsletters:
  label: 'Newsletters'
  description: 'Create newsletters and send messages to your subscribers.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Verwaltung'
subtitle: 'Wähle einen Bereich aus, um zu beginnen.'
camps:
  label: 'Camps'
  description: 'Anmeldungen einsehen, Teilnehmende verwalten und Camp-Einstellungen konfigurieren.'
newsletters:
  label: 'Newsletter'
  description: 'Newsletter erstellen und Nachrichten an Abonnenten senden.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Gestion'
subtitle: 'Sélectionnez une section pour commencer.'
camps:
  label: 'Camps'
  description: 'Consulter les inscriptions, gérer les participants et configurer les paramètres du camp.'
newsletters:
  label: 'Newsletters'
  description: 'Créer des newsletters et envoyer des messages à vos abonnés.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zarządzanie'
subtitle: 'Wybierz sekcję, aby rozpocząć.'
camps:
  label: 'Obozy'
  description: 'Przeglądaj rejestracje, zarządzaj uczestnikami i konfiguruj ustawienia obozu.'
newsletters:
  label: 'Newslettery'
  description: 'Twórz newslettery i wysyłaj wiadomości do swoich subskrybentów.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Správa'
subtitle: 'Vyberte sekci pro začátek.'
camps:
  label: 'Tábory'
  description: 'Zobrazit registrace, spravovat účastníky a konfigurovat nastavení tábora.'
newsletters:
  label: 'Newslettery'
  description: 'Vytvářejte newslettery a odesílejte zprávy svým odběratelům.'
</i18n>
