<template>
  <div
    class="column justify-center q-pa-md col-xs-12 col-sm-8 col-md-5 col-lg-4"
    data-test="registration-group-select"
  >
    <!-- Usually the first page of a shared link: show whose event this is. -->
    <header
      class="group-select__identity rounded-xl q-mb-lg"
      data-test="registration-group-identity"
    >
      <event-cover
        :event
        :ratio="3.4"
        badge-align="center"
      />

      <div
        class="group-select__heading column items-center text-center q-px-md q-pb-md"
      >
        <h1 class="text-h5 text-weight-medium q-my-none">
          {{ to(event.name) }}
        </h1>
        <div
          v-if="details"
          class="text-body2 text-on-surface-variant q-mt-xs"
        >
          {{ details }}
        </div>
      </div>
    </header>

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
import EventCover from '@/components/listedEvents/EventCover.vue';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { countryName } from '@/utils/countries';
import { groupFreePlaces } from '@/utils/eventAvailability';

const { event } = defineProps<{
  event: EventDetails;
}>();

const emit = defineEmits<{
  (e: 'select', group: string): void;
}>();

const { t, locale } = useI18n();
const { to } = useObjectTranslation();

// Both dates in full, like the form's own header right after this page.
const dateRange = computed<string>(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return [event.startAt, event.endAt]
    .map((date) => formatter.format(new Date(date)))
    .join(' – ');
});

// What people check first: when and where.
const details = computed<string>(() =>
  [dateRange.value, to(event.location)].filter(Boolean).join(' · '),
);

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
// Outlined like the group list below it.
.group-select__identity {
  // A definite width: in Quasar's wrapping `column` the height would be
  // sized at a narrower width, so the cover's aspect ratio clips the text.
  width: 100%;
  background: var(--md3-surface-container-low);
  border: 1px solid var(--md3-outline-variant);
  overflow: hidden;
}

.group-select__heading {
  // Clears the badge overlapping down from the cover.
  padding-top: 32px;
}

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
