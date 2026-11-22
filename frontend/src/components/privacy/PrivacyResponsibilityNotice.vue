<template>
  <!-- Next to the publish button: publishing is where the organization takes
       responsibility for the text (docs/privacy.md, 1). -->
  <div
    class="row items-start no-wrap q-gutter-sm text-caption text-on-surface-variant"
    data-test="privacy-responsibility"
  >
    <q-icon
      name="gavel"
      size="16px"
    />
    <div class="col">{{ t('text') }}</div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<i18n lang="yaml" locale="en">
text: 'This page only helps you write the privacy information. Check for yourself that everything is correct – your organisation is responsible for it.'
</i18n>

<i18n lang="yaml" locale="de">
text: 'Diese Seite hilft dir nur beim Verfassen der Datenschutzinformationen. Prüfe selbst, ob alles stimmt – für die Richtigkeit ist deine Organisation verantwortlich.'
</i18n>

<i18n lang="yaml" locale="fr">
text: 'Cette page vous aide seulement à rédiger les informations sur la protection des données. Vérifiez vous-même que tout est exact : votre organisation en est responsable.'
</i18n>

<i18n lang="yaml" locale="cs">
text: 'Tato stránka ti jen pomáhá sepsat informace o ochraně osobních údajů. Zkontroluj, že je vše správně – za správnost odpovídá tvoje organizace.'
</i18n>

<i18n lang="yaml" locale="pl">
text: 'Ta strona jedynie pomaga Ci przygotować informacje o ochronie danych. Sprawdź samodzielnie, czy wszystko się zgadza – odpowiedzialność za ich poprawność ponosi Twoja organizacja.'
</i18n>
