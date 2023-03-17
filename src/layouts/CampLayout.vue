<template>
  <q-layout view="hHh Lpr fFf">
    <!-- Be sure to play with the Layout demo on docs -->

    <!-- (Optional) The Header -->
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title> Header</q-toolbar-title>

        <q-space />

        <language-switch
          borderless
          class="q-px-md"
          dense
          rounded
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <!-- This is where pages get injected -->
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import LanguageSwitch from 'components/localization/LanguageSwitch.vue';
</script>
