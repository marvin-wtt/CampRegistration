<template>
  <header class="event-identity rounded-xl">
    <event-cover
      :event
      :ratio="3.4"
      badge-align="center"
    />

    <div
      class="event-identity__heading column items-center text-center q-px-md q-pb-md"
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
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EventDetails } from '@camp-registration/common/entities';
import EventCover from '@/components/listedEvents/EventCover.vue';
import { useObjectTranslation } from '@/composables/objectTranslation';

const { event } = defineProps<{
  event: Pick<
    EventDetails,
    'id' | 'name' | 'logo' | 'banner' | 'startAt' | 'endAt' | 'location'
  >;
}>();

const { locale } = useI18n();
const { to } = useObjectTranslation();

// Both dates in full, like the form's own header.
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
</script>

<style lang="scss" scoped>
.event-identity {
  // A definite width: in Quasar's wrapping `column` the height would be
  // sized at a narrower width, so the cover's aspect ratio clips the text.
  width: 100%;
  background: var(--md3-surface-container-low);
  border: 1px solid var(--md3-outline-variant);
  overflow: hidden;
}

.event-identity__heading {
  // Clears the badge overlapping down from the cover.
  padding-top: 32px;
}
</style>
