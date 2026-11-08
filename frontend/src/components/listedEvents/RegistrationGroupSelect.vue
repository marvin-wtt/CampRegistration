<template>
  <div
    class="column justify-center q-pa-md col-xs-12 col-sm-8 col-md-5 col-lg-4"
    data-test="registration-group-select"
  >
    <!-- Usually the first page of a shared link: show whose event this is. -->
    <event-identity
      :event
      class="q-mb-lg"
      data-test="registration-group-identity"
    />

    <div class="text-body1 text-center text-on-surface-variant q-mb-md">
      {{ t('prompt') }}
    </div>

    <q-list
      bordered
      separator
      class="group-select__list rounded-xl"
    >
      <q-item
        v-for="option in options"
        :key="option.group"
        clickable
        class="group-select__item"
        :data-test="`registration-group-${option.group}`"
        @click="emit('select', option.group)"
      >
        <q-item-section avatar>
          <country-icon :country="option.group" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-body1">{{ option.name }}</q-item-label>
          <q-item-label
            v-if="option.free !== null"
            caption
            :class="{ 'group-select__waitlist': option.free === 0 }"
          >
            {{
              option.free === 0
                ? t('waitlist')
                : t('places_left', { count: option.free }, option.free)
            }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EventDetails } from '@camp-registration/common/entities';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import EventIdentity from '@/components/listedEvents/EventIdentity.vue';
import { countryName } from '@/utils/countries';
import { groupFreePlaces } from '@/utils/eventAvailability';

const { event } = defineProps<{
  event: EventDetails;
}>();

const emit = defineEmits<{
  (e: 'select', group: string): void;
}>();

const { t, locale } = useI18n();

interface GroupOption {
  group: string;
  name: string;
  // Null when the event shares one limit or doesn't publish its free places.
  free: number | null;
}

const options = computed<GroupOption[]>(() =>
  event.countries.map((group) => ({
    group,
    name: countryName(group, locale.value),
    free: groupFreePlaces(event, group),
  })),
);
</script>

<style lang="scss" scoped>
.group-select__list {
  width: 100%;
  background: var(--md3-surface-container-low);
  overflow: hidden;
}

// Touch-sized rows: this step is mostly reached from a shared link on a phone.
.group-select__item {
  min-height: 64px;
}

.group-select__waitlist {
  color: var(--md3-warning);
}
</style>

<i18n lang="yaml" locale="en">
prompt: 'Which group are you registering for?'
waitlist: 'Waiting list only'
places_left: 'No places left | 1 place left | {count} places left'
</i18n>

<i18n lang="yaml" locale="de">
prompt: 'Für welche Gruppe meldest du dich an?'
waitlist: 'Nur Warteliste'
places_left: 'Keine Plätze frei | Noch 1 Platz frei | Noch {count} Plätze frei'
</i18n>

<i18n lang="yaml" locale="fr">
prompt: "Pour quel groupe t'inscris-tu ?"
waitlist: "Liste d'attente uniquement"
places_left: 'Aucune place restante | 1 place restante | {count} places restantes'
</i18n>

<i18n lang="yaml" locale="pl">
prompt: 'Do której grupy się zapisujesz?'
waitlist: 'Tylko lista rezerwowa'
places_left: 'Wolne miejsca: {count}'
</i18n>

<i18n lang="yaml" locale="cs">
prompt: 'Do které skupiny se registruješ?'
waitlist: 'Pouze čekací listina'
places_left: 'Volná místa: {count}'
</i18n>
