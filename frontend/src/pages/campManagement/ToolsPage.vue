<template>
  <q-page padding>
    <div class="text-h4 q-pa-sm">
      {{ t('title') }}
    </div>

    <!-- content -->
    <q-list bordered>
      <!-- FGYO Tools -->
      <q-expansion-item
        :label="t('fgyo.label')"
        default-opened
      >
        <q-card>
          <q-card-section>
            <div class="q-gutter-x-md">
              <q-btn
                :label="t('fgyo.actions.participation_list')"
                color="primary"
                rounded
                @click="exportParticipants"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import FGYOParticipationListDialog from 'components/campManagement/tools/partispantList/FGYOParticipationListDialog.vue';

const { t } = useI18n();
const quasar = useQuasar();

function exportParticipants() {
  quasar.dialog({
    component: FGYOParticipationListDialog,
  });
}
</script>

<i18n lang="yaml" locale="en">
title: 'Tools'

fgyo:
  label: 'Franco-German Youth Office (FGYO)'
  actions:
    participation_list: 'Generate participation list'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Werkzeuge'

fgyo:
  label: 'Deutsch-Französische Jugendwerk (DFJW)'
  actions:
    participation_list: 'Teilnehmerliste generieren'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Outils'

fgyo:
  label: 'L’Office franco-allemand pour la Jeunesse (OFAJ)'
  actions:
    participation_list: 'Générer la liste des participants'
</i18n>
