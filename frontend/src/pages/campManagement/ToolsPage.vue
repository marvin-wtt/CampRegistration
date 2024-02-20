<template>
  <!-- TODO Use page state handler -->
  <q-page padding>
    <a class="text-h4">
      {{ t('title') }}
    </a>

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
                @click="onFgyoParticipationList"
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
import FgyoParticipantList from 'components/campManagement/tools/fgyo/FgyoParticipantList.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';
import { onMounted } from 'vue';

const { t } = useI18n();
const quasar = useQuasar();

const campDetailsStore = useCampDetailsStore();
const registrationsStore = useRegistrationsStore();

onMounted(async () => {
  await campDetailsStore.fetchData();
  await registrationsStore.fetchData();
});

function onFgyoParticipationList() {
  quasar.dialog({
    component: FgyoParticipantList,
    componentProps: {
      camp: campDetailsStore.data,
      registrations: registrationsStore.data,
    },
  });
}
</script>

<i18n lang="yaml" locale="en">
fgyo:
  label: 'Franco-German Youth Office (FGYO)'
  actions:
    participation_list: 'Generate participation list'
</i18n>

<i18n lang="yaml" locale="de">
fgyo:
  label: 'Deutsch-Französisches Jugendwerk (DFJW)'
  actions:
    participation_list: 'Teilnehmerliste generieren'
</i18n>

<i18n lang="yaml" locale="fr">
fgyo:
  label: 'L’Office franco-allemand pour la Jeunesse (OFAJ)'
  actions:
    participation_list: 'Générer la liste des participants'
</i18n>
