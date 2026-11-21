<template>
  <!-- After "Delete all registrations" (docs/privacy.md, 8). -->
  <!-- The action sits beside the text where there is room for both, and below
       it on a phone, where beside it would squeeze the text into a column. -->
  <q-banner
    dense
    rounded
    :inline-actions="quasar.screen.gt.xs"
    class="bg-surface-container-high text-on-surface"
    :data-test="`purged-${kind}`"
  >
    <template #avatar>
      <q-icon name="auto_delete" />
    </template>
    {{ t(kind) }}
    <template
      v-if="canManage"
      #action
    >
      <m-btn
        :label="t('settings')"
        :to="{ name: 'management.event.settings.data' }"
        secondary
        text
        no-caps
      />
    </template>
  </q-banner>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { usePermissions } from '@/composables/permissions';

const { kind, manageLink = false } = defineProps<{
  kind: 'registrations';
  /** Links to the data settings, for the managers who see them. */
  manageLink?: boolean;
}>();

const { t } = useI18n();
const quasar = useQuasar();
const { canAccess } = usePermissions();

const canManage = computed(
  () =>
    manageLink &&
    canAccess({ any: ['event.registrations.delete', 'event.delete'] }),
);
</script>

<i18n lang="yaml" locale="en">
registrations: 'The registrations of this event were deleted for data protection reasons. The event takes no new registrations.'
settings: 'Data & deletion'
</i18n>

<i18n lang="yaml" locale="de">
registrations: 'Die Anmeldungen dieser Veranstaltung wurden aus Datenschutzgründen gelöscht. Die Veranstaltung nimmt keine neuen Anmeldungen an.'
settings: 'Daten & Löschung'
</i18n>

<i18n lang="yaml" locale="fr">
registrations: 'Les inscriptions de cet événement ont été supprimées pour des raisons de protection des données. L’événement n’accepte plus de nouvelles inscriptions.'
settings: 'Données et suppression'
</i18n>

<i18n lang="yaml" locale="pl">
registrations: 'Zgłoszenia tego wydarzenia zostały usunięte ze względu na ochronę danych. Wydarzenie nie przyjmuje nowych zgłoszeń.'
settings: 'Dane i usuwanie'
</i18n>

<i18n lang="yaml" locale="cs">
registrations: 'Přihlášky této akce byly smazány z důvodu ochrany osobních údajů. Akce nepřijímá nové přihlášky.'
settings: 'Údaje a mazání'
</i18n>
