<template>
  <q-layout view="hHh lpR fFf">
    <q-header
      class="bg-primary text-white"
      elevated
    >
      <q-toolbar>
        <q-toolbar-title>
          {{ $t('title') }}
        </q-toolbar-title>

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

        <profile-menu />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
<script setup>
import ProfileMenu from 'components/campManagement/ProfileMenu.vue';
import LocaleSwitch from 'components/localization/LocaleSwitch.vue';
</script>
