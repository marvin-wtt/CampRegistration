<template>
  <q-card flat>
    <q-form @submit="onSave">
      <q-card-section class="text-h4">
        {{ t('title') }}
      </q-card-section>

      <q-card-section>
        {{ t('description') }}
      </q-card-section>

      <q-card-actions>
        <q-btn
          :label="t('action.export')"
          type="submit"
          color="primary"
          outlined
          rounded
          disable
        />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

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
title: 'Export data'

description: 'Export all data related to this account.'

action:
  export: 'Request data export'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Daten exportieren'

description: 'Exportieren Sie alle Daten, die mit diesem Konto verbunden sind.'

action:
  export: 'Datenexport anfordern'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Exporter les données'

description: 'Exportez toutes les données liées à ce compte.'

action:
  export: 'Demander l’exportation des données'
</i18n>
