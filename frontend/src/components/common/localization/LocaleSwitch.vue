<template>
  <q-select
    v-model="locale"
    :options
    hide-bottom-space
    emit-value
    map-options
    rounded
    dark
  >
    <template #selected-item="scope">
      <country-icon
        class="q-px-xs"
        :locale="scope.opt.value"
        size="xs"
      />
    </template>

    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <country-icon :locale="scope.opt.value" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ scope.opt.label }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
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
];
</script>
