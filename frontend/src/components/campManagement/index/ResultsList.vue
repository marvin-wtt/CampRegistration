<template>
  <q-item class="no-border">
    <q-item-section>
      <q-item-label class="text-h6">
        {{ header }}
      </q-item-label>
    </q-item-section>

    <q-item-section
      v-if="active"
      side
      top
    >
      <q-item-label caption>
        <q-btn
          :label="t('action.create')"
          icon="add"
          outline
          rounded
          @click="onCreateCamp()"
        />
      </q-item-label>
    </q-item-section>
  </q-item>

  <q-separator />

  <template v-if="loading">
    <results-item-skeleton
      v-for="index in 3"
      :key="index"
    />
  </template>

  <q-item
    v-if="camps.length === 0"
    class="text-center vertical-middle"
  >
    <q-item-section v-if="active">
      {{ t('no_data.open') }}
    </q-item-section>
    <q-item-section v-else>
      {{ t('no_data.closed') }}
    </q-item-section>
  </q-item>

  <results-item
    v-else
    v-for="camp in camps"
    :key="camp.id"
    :camp
    :active
  />
</template>

<script lang="ts" setup>
import ResultsItem from 'components/campManagement/index/ResultsItem.vue';
import type { Camp } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import ResultsItemSkeleton from 'components/campManagement/index/ResultsItemSkeleton.vue';
import CampCreateDialog from 'components/campManagement/index/CampCreateDialog.vue';
import { useQuasar } from 'quasar';

const { t } = useI18n();
const quasar = useQuasar();

const {
  camps,
  header,
  active = false,
  loading = false,
} = defineProps<{
  camps: Camp[];
  header: string;
  active?: boolean;
  loading?: boolean;
}>();

function onCreateCamp() {
  quasar.dialog({
    component: CampCreateDialog,
  });
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
no_data:
  open: 'There are no camps currently open for registration. Create a new camp to get started.'
  closed: 'There are no camps closed for registration.'

action:
  create: 'Create new'
</i18n>

<i18n lang="yaml" locale="de">
no_data:
  open: 'Es gibt derzeit keine Camps, die für die Anmeldung geöffnet sind. Erstelle ein neues Camp, um zu beginnen.'
  closed: 'Es gibt keine Camps, die für die Anmeldung geschlossen sind.'

action:
  create: 'Neu erstellen'
</i18n>

<i18n lang="yaml" locale="fr">
no_data:
  open: "Il n'y a actuellement aucun camp ouvert à l'inscription. Créez un nouveau camp pour commencer."
  closed: "Il n'y a pas de camps fermés à l'inscription."

action:
  create: 'Créer un nouveau'
</i18n>
