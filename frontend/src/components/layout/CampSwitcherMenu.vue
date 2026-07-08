<template>
  <q-list class="camp-switcher-menu">
    <q-item-label header>
      {{ t('switch_camp') }}
    </q-item-label>

    <q-item
      v-for="camp in activeCamps"
      :key="camp.id"
      v-close-popup
      clickable
      @click="switchCamp(camp.id)"
    >
      <q-item-section avatar>
        <q-icon name="cabin" />
      </q-item-section>
      <q-item-section class="camp-switcher-menu__name">
        <div class="camp-switcher-menu__label">
          {{ to(camp.name) }}
        </div>
      </q-item-section>
    </q-item>

    <q-expansion-item
      v-if="archivedCamps.length"
      icon="inventory_2"
      :label="t('archived')"
    >
      <q-item
        v-for="camp in archivedCamps"
        :key="camp.id"
        v-close-popup
        clickable
        :inset-level="0.5"
        @click="switchCamp(camp.id)"
      >
        <q-item-section avatar>
          <q-icon name="cabin" />
        </q-item-section>
        <q-item-section class="camp-switcher-menu__name">
          <div class="camp-switcher-menu__label">
            {{ to(camp.name) }}
          </div>
        </q-item-section>
      </q-item>
    </q-expansion-item>

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
import { useAssignedCampsStore } from '@/stores/assigned-camps-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { isCampArchived } from '@/utils/campPhase';
import type { Camp } from '@camp-registration/common/entities';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { to } = useObjectTranslation();

const assignedCampsStore = useAssignedCampsStore();

const otherCamps = computed<Camp[]>(() => {
  return (assignedCampsStore.data ?? [])
    .filter((camp) => camp.id !== route.params.campId)
    .sort((a, b) => b.startAt.localeCompare(a.startAt));
});

const activeCamps = computed<Camp[]>(() =>
  otherCamps.value.filter((camp) => !isCampArchived(camp)),
);

const archivedCamps = computed<Camp[]>(() =>
  otherCamps.value.filter((camp) => isCampArchived(camp)),
);

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
archived: 'Archived'
</i18n>

<i18n lang="yaml" locale="de">
camps: 'Meine Camps'
switch_camp: 'Camp wechseln'
archived: 'Archiviert'
</i18n>

<i18n lang="yaml" locale="fr">
camps: 'Mes Camps'
switch_camp: 'Changer de camp'
archived: 'Archivés'
</i18n>

<i18n lang="yaml" locale="pl">
camps: 'Moje Campy'
switch_camp: 'Zmień obóz'
archived: 'Zarchiwizowane'
</i18n>

<i18n lang="yaml" locale="cs">
camps: 'Moje Campy'
switch_camp: 'Změnit tábor'
archived: 'Archivované'
</i18n>

<style scoped>
.camp-switcher-menu {
  min-width: min(240px, calc(100vw - 32px));
  max-width: min(420px, calc(100vw - 32px));
}

.camp-switcher-menu__name {
  min-width: 0;
}

.camp-switcher-menu__label {
  line-height: 1.25;
  overflow-wrap: anywhere;
  white-space: normal;
}
</style>
