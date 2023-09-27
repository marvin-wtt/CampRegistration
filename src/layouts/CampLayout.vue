<template>
  <q-layout view="hHh Lpr fFf">
    <!-- Be sure to play with the Layout demo on docs -->

    <!-- (Optional) The Header -->
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          <router-link
            to="/"
            style="text-decoration: none; color: inherit"
          >
            {{ t('app_name') }}
          </router-link>
        </q-toolbar-title>

        <q-space />

        <q-btn
          :label="t('camps')"
          :to="{ name: 'camps' }"
          flat
          stretch
        />

        <q-separator
          dark
          vertical
        />

        <language-switch
          borderless
          class="q-px-md"
          dense
          rounded
        />
      </q-toolbar>
    </q-header>

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
import LanguageSwitch from 'components/common/localization/LocaleSwitch.vue';
import { useI18n } from 'vue-i18n';
import {useMeta} from 'quasar';

const { t } = useI18n();

useMeta(() => {
  return {
    title: 'Camps',
    titleTemplate: title => `${title} | ${t('app_name')}`,
  };
});
</script>

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

<i18n lang="yaml" locale="en">
camps: 'Camps'
</i18n>

<i18n lang="yaml" locale="de">
camps: 'Camps'
</i18n>

<i18n lang="yaml" locale="fr">
camps: 'Camps'
</i18n>
