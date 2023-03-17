<template>
  <q-select
    v-model="locale"
    :options="langOptions"
    v-bind="$attrs"
    emit-value
    map-options
  >
    <template v-slot:selected-item="scope">
      <country-icon
        :locale="scope.opt.value"
        size="sm"
      />
    </template>

    <template v-slot:option="scope">
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CountryIcon from 'components/localization/CountryIcon.vue';

const { locale } = useI18n({ useScope: 'global' });

const langOptions = computed(() => [
  { label: 'Deutsch', value: 'de-DE', country: 'de', isoName: 'de' },
  { label: 'Français', value: 'fr-FR', country: 'fr', isoName: 'fr' },
  { label: 'English (US)', value: 'en-US', country: 'us', isoName: 'en-US' },
]);
</script>
