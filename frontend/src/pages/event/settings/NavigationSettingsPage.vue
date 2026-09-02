<template>
  <q-page
    padding
    class="navigation-settings-page row justify-center"
  >
    <div class="col-12 col-sm-10 col-md-8 col-lg-6 column q-gutter-y-lg">
      <div class="page-title">
        <div class="text-h5 text-weight-medium">
          {{ t('title') }}
        </div>
        <div class="text-body2 text-on-surface-variant q-mt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <q-list
        bordered
        separator
        class="rounded-borders overflow-hidden"
      >
        <q-item
          v-for="item in hideableItems"
          :key="item.name"
          tag="label"
          class="q-py-md"
        >
          <q-item-section avatar>
            <q-icon
              :name="item.icon"
              color="grey-7"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ t(`${item.name}.label`) }}
            </q-item-label>
            <q-item-label caption>
              {{ t(`${item.name}.description`) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-toggle
              :model-value="isVisible(item.name)"
              :disable="isLoading"
              @update:model-value="(value) => setVisible(item.name, value)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { EVENT_NAVIGATION_ITEMS } from '@/config/eventNavigationItems';
import { useNavigationSettings } from '@/composables/eventNavigationSettings';

const { t } = useI18n();

const { settings, isLoading } = useNavigationSettings();

const hideableItems = EVENT_NAVIGATION_ITEMS.filter((item) => item.hideable);

function isVisible(name: string): boolean {
  return !settings.hiddenItems.includes(name);
}

function setVisible(name: string, visible: boolean) {
  settings.hiddenItems = visible
    ? settings.hiddenItems.filter((item) => item !== name)
    : [...settings.hiddenItems, name];
}
</script>

<style scoped>
@media (max-width: 599px) {
  .navigation-settings-page {
    padding-top: 24px;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Navigation'
subtitle: "Choose which features appear in this event's navigation."
contact:
  label: 'Contact'
  description: 'Show or hide the contact page.'
program_planner:
  label: 'Program'
  description: 'Show or hide the program planner.'
room_planner:
  label: 'Room Planner'
  description: 'Show or hide the room planner.'
tasks:
  label: 'Tasks'
  description: 'Show or hide the task list.'
chore_planner:
  label: 'Duty Roster'
  description: 'Show or hide the duty roster.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Navigation'
subtitle: 'Wähle aus, welche Funktionen in der Navigation dieser Veranstaltung angezeigt werden.'
contact:
  label: 'Kontaktieren'
  description: 'Kontaktseite ein- oder ausblenden.'
program_planner:
  label: 'Programm'
  description: 'Programmplaner ein- oder ausblenden.'
room_planner:
  label: 'Raumplaner'
  description: 'Raumplaner ein- oder ausblenden.'
tasks:
  label: 'Aufgaben'
  description: 'Aufgabenliste ein- oder ausblenden.'
chore_planner:
  label: 'Dienstplan'
  description: 'Dienstplan ein- oder ausblenden.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Navigation'
subtitle: 'Choisissez les fonctionnalités affichées dans la navigation de cet événement.'
contact:
  label: 'Contacter'
  description: 'Afficher ou masquer la page de contact.'
program_planner:
  label: 'Programme'
  description: "Afficher ou masquer l'aménageur de programme."
room_planner:
  label: 'Aménageur'
  description: "Afficher ou masquer l'aménageur de chambres."
tasks:
  label: 'Tâches'
  description: 'Afficher ou masquer la liste des tâches.'
chore_planner:
  label: 'Plan des corvées'
  description: 'Afficher ou masquer le plan des corvées.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Nawigacja'
subtitle: 'Wybierz funkcje widoczne w nawigacji tego wydarzenia.'
contact:
  label: 'Kontakt'
  description: 'Pokaż lub ukryj stronę kontaktową.'
program_planner:
  label: 'Program'
  description: 'Pokaż lub ukryj planer programu.'
room_planner:
  label: 'Plan pokoi'
  description: 'Pokaż lub ukryj plan pokoi.'
tasks:
  label: 'Zadania'
  description: 'Pokaż lub ukryj listę zadań.'
chore_planner:
  label: 'Grafik dyżurów'
  description: 'Pokaż lub ukryj grafik dyżurów.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Navigace'
subtitle: 'Vyberte, které funkce se zobrazí v navigaci této akce.'
contact:
  label: 'Kontakt'
  description: 'Zobrazit nebo skrýt kontaktní stránku.'
program_planner:
  label: 'Program'
  description: 'Zobrazit nebo skrýt plánovač programu.'
room_planner:
  label: 'Plán pokojů'
  description: 'Zobrazit nebo skrýt plán pokojů.'
tasks:
  label: 'Úkoly'
  description: 'Zobrazit nebo skrýt seznam úkolů.'
chore_planner:
  label: 'Rozpis služeb'
  description: 'Zobrazit nebo skrýt rozpis služeb.'
</i18n>
