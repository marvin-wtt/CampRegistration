<template>
  <q-btn
    aria-label="Toggle localization"
    icon="language"
  >
    <q-menu>
      <q-list style="min-width: 200px">
        <q-item
          v-for="option in options"
          :key="option.value"
          clickable
          v-ripple
          @click="locale = option.value"
        >
          <q-item-section avatar>
            <country-icon :locale="option.value" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ option.label }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import CountryIcon from 'components/common/localization/CountryIcon.vue';

const { locale } = useI18n({ useScope: 'global' });

const options = [
  {
    label: 'Deutsch',
    value: 'de-DE',
  },
  {
    label: 'Français',
    value: 'fr-FR',
  },
  {
    label: 'English (US)',
    value: 'en-US',
  },
  {
    label: 'Polski',
    value: 'pl-PL',
  },
  {
    label: 'Česky',
    value: 'cs-CZ',
  },
];
</script>
