<template>
  <q-btn
    :label="t('addLanguage')"
    icon="add"
    color="primary"
    flat
    dense
    rounded
    no-caps
    size="sm"
    :disable
    data-test="add-translation-button"
  >
    <q-menu>
      <q-list dense>
        <q-item
          v-for="loc in locales"
          :key="loc"
          v-close-popup
          clickable
          :data-test="`add-translation-${loc}`"
          @click="emit('add', loc)"
        >
          <q-item-section avatar>
            <country-icon :locale="loc" />
          </q-item-section>
          <q-item-section>{{ languageName(loc) }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import { useI18n } from 'vue-i18n';
import { useLanguageName } from '@/composables/addedLocales';

const { locales, disable = false } = defineProps<{
  locales: string[];
  disable?: boolean | undefined;
}>();

const emit = defineEmits<{
  add: [locale: string];
}>();

const { t } = useI18n();
const languageName = useLanguageName();
</script>

<i18n lang="yaml" locale="en">
addLanguage: 'Add language'
</i18n>

<i18n lang="yaml" locale="de">
addLanguage: 'Sprache hinzufügen'
</i18n>

<i18n lang="yaml" locale="fr">
addLanguage: 'Ajouter une langue'
</i18n>

<i18n lang="yaml" locale="pl">
addLanguage: 'Dodaj język'
</i18n>

<i18n lang="yaml" locale="cs">
addLanguage: 'Přidat jazyk'
</i18n>
