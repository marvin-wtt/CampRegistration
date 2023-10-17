<template>
  <country-switch
    v-model="locale"
    hide-bottom-space
    native-names
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import CountrySwitch from 'components/common/CountrySwitch.vue';

const { locale } = useI18n({ useScope: 'global' });
</script>
