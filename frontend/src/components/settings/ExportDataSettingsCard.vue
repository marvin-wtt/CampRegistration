<template>
  <q-form @submit="onSave">
    <q-card-section>
      <div class="text-body2 text-on-surface-variant">
        {{ t('description') }}
      </div>
    </q-card-section>

    <q-card-actions class="items-center q-gutter-sm">
      <m-btn
        :label="t('action.export')"
        type="submit"
        color="primary"
        flat
        disable
      />
      <div class="text-body2 text-on-surface-variant">
        {{ t('comingSoon') }}
      </div>
    </q-card-actions>
  </q-form>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'export'): void;
}>();

function onSave() {
  emit('export');
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
description: 'Export all data related to this account.'
comingSoon: 'Not available yet.'

action:
  export: 'Request data export'
</i18n>

<i18n lang="yaml" locale="de">
description: 'Exportieren Sie alle Daten, die mit diesem Konto verbunden sind.'
comingSoon: 'Noch nicht verfügbar.'

action:
  export: 'Datenexport anfordern'
</i18n>

<i18n lang="yaml" locale="fr">
description: 'Exportez toutes les données liées à ce compte.'
comingSoon: 'Pas encore disponible.'

action:
  export: 'Demander l’exportation des données'
</i18n>

<i18n lang="yaml" locale="pl">
description: 'Wyeksportuj wszystkie dane powiązane z tym kontem.'
comingSoon: 'Jeszcze niedostępne.'

action:
  export: 'Zażądaj eksportu danych'
</i18n>

<i18n lang="yaml" locale="cs">
description: 'Exportujte všechna data spojená s tímto účtem.'
comingSoon: 'Zatím není k dispozici.'

action:
  export: 'Požádat o export dat'
</i18n>
