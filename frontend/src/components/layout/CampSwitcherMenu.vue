<template>
  <q-list style="min-width: 240px">
    <q-item-label header>
      {{ t('switch_camp') }}
    </q-item-label>

    <q-item
      v-for="camp in otherCamps"
      :key="camp.id"
      v-close-popup
      clickable
      @click="switchCamp(camp.id)"
    >
      <q-item-section avatar>
        <q-icon name="cabin" />
      </q-item-section>
      <q-item-section>
        {{ to(camp.name) }}
      </q-item-section>
    </q-item>

    <q-separator spaced />

    <q-item
      v-close-popup
      clickable
      :to="{ name: 'management.camps' }"
    >
      <q-item-section avatar>
        <q-icon name="grid_view" />
      </q-item-section>
      <q-item-section>
        {{ t('camps') }}
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAssignedCampsStore } from 'stores/assigned-camps-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import type { Camp } from '@camp-registration/common/entities';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { to } = useObjectTranslation();

const assignedCampsStore = useAssignedCampsStore();

const otherCamps = computed<Camp[]>(() => {
  return (assignedCampsStore.data ?? []).filter(
    (camp) => camp.id !== route.params.campId,
  );
});

function switchCamp(campId: string) {
  if (campId === route.params.campId || !route.name) {
    return;
  }

  void router.push({
    name: route.name,
    params: { ...route.params, campId },
  });
}
</script>

<i18n lang="yaml" locale="en">
camps: 'My Camps'
switch_camp: 'Switch camp'
</i18n>

<i18n lang="yaml" locale="de">
camps: 'Meine Camps'
switch_camp: 'Camp wechseln'
</i18n>

<i18n lang="yaml" locale="fr">
camps: 'Mes Camps'
switch_camp: 'Changer de camp'
</i18n>

<i18n lang="yaml" locale="pl">
camps: 'Moje Campy'
switch_camp: 'Zmień obóz'
</i18n>

<i18n lang="yaml" locale="cs">
camps: 'Moje Campy'
switch_camp: 'Změnit tábor'
</i18n>
