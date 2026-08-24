<template>
  <page-state-handler
    padding
    :error
    :loading="isLoading"
    class="row justify-center"
  >
    <div class="column col-sm-10 col-md-8 col-12 q-gutter-md">
      <div class="text-h6">{{ t('title') }}</div>

      <q-banner
        dense
        class="scope-note rounded-md"
      >
        <template #avatar>
          <q-icon name="info" />
        </template>
        {{ t('scope') }}
      </q-banner>

      <q-list
        v-if="camps.length > 0"
        bordered
        separator
        class="rounded-lg"
      >
        <q-item
          v-for="camp in camps"
          :key="camp.id"
          clickable
          :to="{
            name: 'management.camp.settings',
            params: { campId: camp.id },
          }"
        >
          <q-item-section>
            <q-item-label>{{ to(camp.name) }}</q-item-label>
            <q-item-label caption>
              {{ d(new Date(camp.startAt), 'short') }} –
              {{ d(new Date(camp.endAt), 'short') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row items-center q-gutter-xs">
              <q-chip
                v-if="!camp.listed"
                dense
                square
                size="sm"
                icon="lock"
              >
                {{ t('listed') }}
              </q-chip>
              <q-chip
                :color="statusColor(camp.registrationStatus)"
                text-color="white"
                dense
                square
                size="sm"
              >
                {{ t(`status.${camp.registrationStatus}`) }}
              </q-chip>
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <div
        v-else-if="!isLoading"
        class="column items-center q-pa-xl text-on-surface-variant"
      >
        <q-icon
          name="cabin"
          size="3rem"
        />
        <div class="text-subtitle1 q-mt-md">{{ t('empty') }}</div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { useOrganizationCampsStore } from '@/stores/organization-camps-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import type {
  Camp,
  CampRegistrationStatus,
} from '@camp-registration/common/entities';

const { t, d } = useI18n();
const { to } = useObjectTranslation();
const store = useOrganizationCampsStore();
const { data, isLoading, error } = storeToRefs(store);

const camps = computed<Camp[]>(() => data.value ?? []);

function statusColor(status: CampRegistrationStatus): string {
  if (status === 'open') return 'positive';
  if (status === 'upcoming') return 'info';
  return 'grey-7';
}

onMounted(async () => {
  await store.fetchData();
});
</script>

<style lang="scss" scoped>
.scope-note {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Camps'
scope: 'You can see every camp of this organization and close its registration. Viewing participants requires a separate invitation to the camp.'
listed: 'Unlisted'
empty: 'This organization has no camps yet'
status:
  open: 'Registration open'
  upcoming: 'Registration upcoming'
  closed: 'Registration closed'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Camps'
scope: 'Du siehst jedes Camp dieser Organisation und kannst dessen Anmeldung schließen. Für die Teilnehmenden ist eine separate Einladung zum Camp nötig.'
listed: 'Nicht gelistet'
empty: 'Diese Organisation hat noch keine Camps'
status:
  open: 'Anmeldung offen'
  upcoming: 'Anmeldung bevorstehend'
  closed: 'Anmeldung geschlossen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Camps'
scope: 'Tu vois chaque camp de cette organisation et peux en fermer les inscriptions. Voir les participants nécessite une invitation distincte au camp.'
listed: 'Non répertorié'
empty: "Cette organisation n'a pas encore de camps"
status:
  open: 'Inscriptions ouvertes'
  upcoming: 'Inscriptions à venir'
  closed: 'Inscriptions fermées'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Obozy'
scope: 'Widzisz każdy obóz tej organizacji i możesz zamknąć jego rejestrację. Podgląd uczestników wymaga osobnego zaproszenia do obozu.'
listed: 'Ukryty'
empty: 'Ta organizacja nie ma jeszcze obozów'
status:
  open: 'Rejestracja otwarta'
  upcoming: 'Rejestracja wkrótce'
  closed: 'Rejestracja zamknięta'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Tábory'
scope: 'Vidíš každý tábor této organizace a můžeš uzavřít jeho registraci. Zobrazení účastníků vyžaduje samostatné pozvání do tábora.'
listed: 'Skrytý'
empty: 'Tato organizace zatím nemá žádné tábory'
status:
  open: 'Registrace otevřena'
  upcoming: 'Registrace se blíží'
  closed: 'Registrace uzavřena'
</i18n>
