<template>
  <q-select
    v-model="locale"
    :options="locales"
    borderless
    class="q-px-md"
    dense
    emit-value
    map-options
    rounded
  >
    <template v-slot:selected-item="scope">
      <country-icon
        :locale="scope.opt.country"
        size="sm"
      />
    </template>

    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <country-icon :locale="scope.opt.country" />
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

const locales = computed(() => [
  { label: 'Deutsch', value: 'de-DE', country: 'de' },
  { label: 'Français', value: 'fr-FR', country: 'fr' },
  { label: 'English', value: 'en-US', country: 'us' },
]);
</script>
