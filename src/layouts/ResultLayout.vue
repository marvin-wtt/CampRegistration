<template>
  <q-layout view="hHh Lpr lff">
    <q-ajax-bar color="accent" />

    <q-header
      class="bg-primary text-white"
      elevated
    >
      <q-toolbar>
        <q-btn
          v-if="showDrawer"
          dense
          flat
          icon="menu"
          round
          @click="drawer = !drawer"
        />
        <q-toolbar-title>
          {{ t('app_name') }}
        </q-toolbar-title>

        <q-space />

        <q-separator
          dark
          vertical
        />

        <q-btn
          :label="t('camps')"
          :to="{ name: 'results-index' }"
          flat
          stretch
        />

        <q-separator
          dark
          vertical
        />

        <locale-switch
          borderless
          class="q-px-md"
          dense
          rounded
        />

        <q-separator
          dark
          vertical
        />

        <profile-menu-button />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="showDrawer"
      v-model="drawer"
      :breakpoint="500"
      :class="quasar.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'"
      :mini="miniState"
      :width="200"
      bordered
      mini-to-overlay
      show-if-above
      @mouseout="miniState = true"
      @mouseover="miniState = false"
    >
      <!-- TODO -->
      <!--            <q-scroll-area-->
      <!--              class='fit'-->
      <!--              horizontal-thumb-style='opacity: 0'-->
      <!--            >-->
      <q-list padding>
        <q-item
          v-ripple
          :to="{ name: 'results-dashboard' }"
          clickable
        >
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>

          <q-item-section>
            {{ t('dashboard') }}
          </q-item-section>
        </q-item>

        <q-item
          v-ripple
          :to="{ name: 'results-participants' }"
          clickable
        >
          <q-item-section avatar>
            <q-icon name="groups" />
          </q-item-section>

          <q-item-section>
            {{ t('participants') }}
          </q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          disable
        >
          <q-item-section avatar>
            <q-icon name="supervisor_account" />
          </q-item-section>

          <q-item-section>
            <q-badge
              align="top"
              floating
              rounded
              >Coming soon!
            </q-badge>
            {{ t('supervisors') }}
          </q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          disable
        >
          <q-item-section avatar>
            <q-icon name="show_chart" />
          </q-item-section>

          <q-item-section>
            <q-badge
              align="top"
              floating
              rounded
              >Coming soon!
            </q-badge>
            {{ t('statistics') }}
          </q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          disable
        >
          <q-item-section avatar>
            <q-icon name="email" />
          </q-item-section>

          <q-item-section>
            <q-badge
              align="top"
              floating
              rounded
              >Coming soon!
            </q-badge>
            {{ t('contact') }}
          </q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          :to="{ name: 'room-planner' }"
        >
          <q-item-section avatar>
            <q-icon name="single_bed" />
          </q-item-section>

          <q-item-section>
            {{ t('room_planner') }}
          </q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          :to="{ name: 'tools' }"
        >
          <q-item-section avatar>
            <q-icon name="menu" />
          </q-item-section>

          <q-item-section>
            {{ t('tools') }}
          </q-item-section>
        </q-item>

        <q-item
          v-ripple
          :to="{ name: 'edit-camp' }"
          clickable
        >
          <q-item-section avatar>
            <q-icon name="edit" />
          </q-item-section>

          <q-item-section>
            {{ t('edit') }}
          </q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          disable
        >
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>

          <q-item-section>
            <q-badge
              align="top"
              floating
              rounded
              >Coming soon!
            </q-badge>
            {{ t('settings') }}
          </q-item-section>
        </q-item>
      </q-list>
      <!--            </q-scroll-area>-->
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import LocaleSwitch from 'components/localization/LocaleSwitch.vue';
import ProfileMenuButton from 'components/results/ProfileMenuButton.vue';
import { useCampDetailsStore } from 'stores/camp/camp-details-store';
import { useCampRegistrationsStore } from 'stores/camp/camp-registration-store';
import { useResultTemplateStore } from 'stores/result-template-store';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';

const quasar = useQuasar();
const route = useRoute();
const { t } = useI18n();

const campDetailStore = useCampDetailsStore();
const campRegistrationsStore = useCampRegistrationsStore();
const resultTemplateStore = useResultTemplateStore();

// TODO Dont do for index page
campDetailStore.fetchData();
campRegistrationsStore.fetchData();
resultTemplateStore.fetchTemplates();

const drawer = ref<boolean>(false);
const miniState = ref<boolean>(true);

const showDrawer = computed<boolean>(() => {
  return route.meta.hideDrawer !== true;
});
</script>

<i18n lang="yaml" locale="en">
camps: 'Camps'
contact: 'Contact'
dashboard: 'Dashboard'
edit: 'Edit'
participants: 'Participants'
room_planner: 'Room Planner'
settings: 'Settings'
statistics: 'Statistics'
supervisors: 'Supervisors'
tools: 'Tools'
</i18n>

<i18n lang="yaml" locale="de">
camps: 'Camps'
contact: 'Kontaktieren'
dashboard: 'Dashboard'
edit: 'Bearbeiten'
participants: 'Teilnehmende'
room_planner: 'Raumplaner'
settings: 'Einstellungen'
statistics: 'Statistiken'
supervisors: 'Betreuende'
tools: 'Tools'
</i18n>

<i18n lang="yaml" locale="fr">
camps: 'Camps'
contact: 'Contacter'
dashboard: 'Dashboard'
edit: 'Modifier'
participants: 'Participants'
room_planner: 'Aménageur'
settings: 'Paramètres'
statistics: 'Statistiques'
supervisors: 'Responsables'
tools: 'Tools'
</i18n>

<style>
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #f5f5f5;
}

::-webkit-scrollbar {
  height: 0.5rem;
  width: 0.5rem;
  background-color: #f5f5f5;
}

::-webkit-scrollbar-thumb {
  cursor: all-scroll;
  background-color: #646464;
}
</style>
