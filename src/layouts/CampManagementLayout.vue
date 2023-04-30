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
          <q-skeleton
            v-if="campDetailStore.isLoading"
            type="text"
          />
          <a v-else>
            {{ to(title) }}
          </a>
        </q-toolbar-title>

        <q-space />

        <q-separator
          dark
          vertical
        />

        <q-btn
          :label="t('camps')"
          :to="{ name: 'campManagement' }"
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

        <q-btn
          flat
          icon="account_circle"
          stretch
        >
          <profile-menu />
        </q-btn>
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
          :to="{ name: 'dashboard' }"
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
          v-if="beta"
          v-ripple
          :to="{ name: 'participants' }"
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
          v-if="beta"
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
          v-if="beta"
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
          v-if="beta"
          v-ripple
          clickable
          :to="{ name: 'program-planner' }"
        >
          <q-item-section avatar>
            <q-icon name="event" />
          </q-item-section>

          <q-item-section>
            {{ t('program_planner') }}
          </q-item-section>
        </q-item>

        <q-item
          v-if="beta"
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
          v-if="beta"
          v-ripple
          clickable
          :to="{ name: 'expenses' }"
        >
          <q-item-section avatar>
            <q-icon name="payments" />
          </q-item-section>

          <q-item-section>
            {{ t('expenses') }}
          </q-item-section>
        </q-item>

        <q-item
          v-if="beta"
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
          v-if="beta"
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
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import LocaleSwitch from 'components/localization/LocaleSwitch.vue';
import ProfileMenu from 'components/campManagement/ProfileMenu.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';
import { useTemplateStore } from 'stores/template-store';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';
import * as process from 'process';
import { useObjectTranslation } from 'src/composables/objectTranslation';

const quasar = useQuasar();
const route = useRoute();
const { t } = useI18n();
const { to } = useObjectTranslation();

const authStore = useAuthStore();
const campDetailStore = useCampDetailsStore();
const templateStore = useTemplateStore();
const registrationsStore = useRegistrationsStore();

// TODO The component should register itself each the store instead
authStore.fetchUser();
// TODO Dont do for index page
campDetailStore.fetchData();
templateStore.fetchData();
registrationsStore.fetchData();

const drawer = ref<boolean>(false);
const miniState = ref<boolean>(true);

const beta = computed<boolean>(() => {
  // TODO Maybe add feature flag
  return process.env.NODE_ENV === 'development';
});

const showDrawer = computed<boolean>(() => {
  return !('hideDrawer' in route.meta) || route.meta.hideDrawer !== true;
});

const title = computed(() => {
  return showDrawer.value ? campDetailStore.data?.name : t('app_name');
});
</script>

<i18n lang="yaml" locale="en">
camps: 'Camps'
contact: 'Contact'
dashboard: 'Dashboard'
edit: 'Edit'
expenses: 'Expenses'
participants: 'Participants'
program_planner: 'Program'
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
expenses: 'Ausgaben'
participants: 'Teilnehmende'
program_planner: 'Programm'
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
expenses: 'Dépenses'
participants: 'Participants'
program_planner: 'Programme'
room_planner: 'Aménageur'
settings: 'Paramètres'
statistics: 'Statistiques'
supervisors: 'Responsables'
tools: 'Tools'
</i18n>

<style>
/* width */
::-webkit-scrollbar {
  width: 0.5rem;
  height: 0.5rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scrollbar */
/* Track */
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 0.125rem grey;
  border-radius: 0.25rem;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #656565;
  border-radius: 0.25rem;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #4b4b4b;
}

::-webkit-scrollbar-corner {
}
</style>
