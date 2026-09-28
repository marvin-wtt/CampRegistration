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
        v-if="events.length > 0"
        bordered
        separator
        class="rounded-lg"
      >
        <q-item
          v-for="event in events"
          :key="event.id"
          clickable
          :to="{
            name: 'management.event.settings',
            params: { eventId: event.id },
          }"
        >
          <q-item-section>
            <q-item-label>{{ to(event.name) }}</q-item-label>
            <q-item-label caption>
              {{ d(new Date(event.startAt), 'short') }} –
              {{ d(new Date(event.endAt), 'short') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row items-center q-gutter-xs">
              <q-chip
                v-if="!event.listed"
                dense
                square
                size="sm"
                icon="lock"
              >
                {{ t('listed') }}
              </q-chip>
              <q-chip
                :color="statusColor(event.registrationStatus)"
                text-color="white"
                dense
                square
                size="sm"
              >
                {{ t(`status.${event.registrationStatus}`) }}
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
import { useOrganizationEventsStore } from '@/stores/organization-events-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import type {
  Event,
  EventRegistrationStatus,
} from '@camp-registration/common/entities';

const { t, d } = useI18n();
const { to } = useObjectTranslation();
const store = useOrganizationEventsStore();
const { data, isLoading, error } = storeToRefs(store);

const events = computed<Event[]>(() => data.value ?? []);

function statusColor(status: EventRegistrationStatus): string {
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
title: 'Events'
scope: 'You can see every event of this organization and close its registration. Viewing participants requires a separate invitation to the event.'
listed: 'Unlisted'
empty: 'This organization has no events yet'
status:
  open: 'Registration open'
  upcoming: 'Registration upcoming'
  closed: 'Registration closed'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Veranstaltungen'
scope: 'Du siehst jede Veranstaltung dieser Organisation und kannst dessen Anmeldung schließen. Für die Teilnehmenden ist eine separate Einladung zur Veranstaltung nötig.'
listed: 'Nicht gelistet'
empty: 'Diese Organisation hat noch keine Veranstaltungen'
status:
  open: 'Anmeldung offen'
  upcoming: 'Anmeldung bevorstehend'
  closed: 'Anmeldung geschlossen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Événements'
scope: 'Tu vois chaque événement de cette organisation et peux en fermer les inscriptions. Voir les participants nécessite une invitation distincte au événement.'
listed: 'Non répertorié'
empty: "Cette organisation n'a pas encore d'événements"
status:
  open: 'Inscriptions ouvertes'
  upcoming: 'Inscriptions à venir'
  closed: 'Inscriptions fermées'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wydarzenia'
scope: 'Widzisz każde wydarzenie tej organizacji i możesz zamknąć jego rejestrację. Podgląd uczestników wymaga osobnego zaproszenia do wydarzenia.'
listed: 'Ukryty'
empty: 'Ta organizacja nie ma jeszcze wydarzeń'
status:
  open: 'Rejestracja otwarta'
  upcoming: 'Rejestracja wkrótce'
  closed: 'Rejestracja zamknięta'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Akce'
scope: 'Vidíš každou akci této organizace a můžeš uzavřít její registraci. Zobrazení účastníků vyžaduje samostatné pozvání do akce.'
listed: 'Skrytý'
empty: 'Tato organizace zatím nemá žádné akce'
status:
  open: 'Registrace otevřena'
  upcoming: 'Registrace se blíží'
  closed: 'Registrace uzavřena'
</i18n>
