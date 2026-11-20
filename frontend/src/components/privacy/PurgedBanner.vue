<template>
  <!-- After "Delete all registrations" (docs/privacy.md, 8): says why the
       people are missing from what is still shown. -->
  <q-banner
    dense
    rounded
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
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { usePermissions } from '@/composables/permissions';

const { kind, manageLink = false } = defineProps<{
  kind: 'assignments' | 'registrations';
  /** Links to the data settings, for the managers who see them. */
  manageLink?: boolean;
}>();

const { t } = useI18n();
const { canAccess } = usePermissions();

const canManage = computed(
  () =>
    manageLink &&
    canAccess({ any: ['event.registrations.delete', 'event.delete'] }),
);
</script>

<i18n lang="yaml" locale="en">
assignments: 'Participant data was deleted for data protection reasons, so the assignments were removed.'
registrations: 'The registrations of this event were deleted for data protection reasons. The event takes no new registrations.'
settings: 'Data & deletion'
</i18n>

<i18n lang="yaml" locale="de">
assignments: 'Die Teilnehmerdaten wurden aus Datenschutzgründen gelöscht, daher wurden die Zuteilungen entfernt.'
registrations: 'Die Anmeldungen dieser Veranstaltung wurden aus Datenschutzgründen gelöscht. Die Veranstaltung nimmt keine neuen Anmeldungen an.'
settings: 'Daten & Löschung'
</i18n>

<i18n lang="yaml" locale="fr">
assignments: 'Les données des participants ont été supprimées pour des raisons de protection des données, les attributions ont donc été retirées.'
registrations: 'Les inscriptions de cet événement ont été supprimées pour des raisons de protection des données. L’événement n’accepte plus de nouvelles inscriptions.'
settings: 'Données et suppression'
</i18n>

<i18n lang="yaml" locale="pl">
assignments: 'Dane uczestników zostały usunięte ze względu na ochronę danych, dlatego przydziały zostały usunięte.'
registrations: 'Zgłoszenia tego wydarzenia zostały usunięte ze względu na ochronę danych. Wydarzenie nie przyjmuje nowych zgłoszeń.'
settings: 'Dane i usuwanie'
</i18n>

<i18n lang="yaml" locale="cs">
assignments: 'Údaje účastníků byly smazány z důvodu ochrany osobních údajů, proto byla přiřazení odstraněna.'
registrations: 'Přihlášky této akce byly smazány z důvodu ochrany osobních údajů. Akce nepřijímá nové přihlášky.'
settings: 'Údaje a mazání'
</i18n>
