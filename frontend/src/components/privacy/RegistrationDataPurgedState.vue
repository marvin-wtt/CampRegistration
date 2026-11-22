<template>
  <!-- After "Delete all registrations" (docs/privacy.md, 8). -->
  <div
    class="column items-center justify-center q-pa-lg text-center"
    data-test="registration-data-purged"
  >
    <q-icon
      name="auto_delete"
      size="48px"
      class="text-on-surface-variant"
    />
    <div class="text-h6 q-mt-md">{{ t('title') }}</div>
    <p class="text-body2 text-on-surface-variant purged-text">
      {{ t('message') }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.purged-text {
  max-width: 28rem;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Registration data deleted'
message: 'The registrations of this event were deleted for data protection reasons. The event takes no new registrations.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Anmeldedaten gelöscht'
message: 'Die Anmeldungen dieser Veranstaltung wurden aus Datenschutzgründen gelöscht. Die Veranstaltung nimmt keine neuen Anmeldungen an.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Données d’inscription supprimées'
message: 'Les inscriptions de cet événement ont été supprimées pour des raisons de protection des données. L’événement n’accepte plus de nouvelles inscriptions.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Dane zgłoszeń usunięte'
message: 'Zgłoszenia tego wydarzenia zostały usunięte ze względu na ochronę danych. Wydarzenie nie przyjmuje nowych zgłoszeń.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Údaje z přihlášek smazány'
message: 'Přihlášky této akce byly smazány z důvodu ochrany osobních údajů. Akce nepřijímá nové přihlášky.'
</i18n>
