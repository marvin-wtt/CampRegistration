<template>
  <page-state-handler
    :loading="loading"
    :error="error"
    class="row justify-center"
  >
    <div
      v-if="knownError"
      class="column justify-center items-center q-pa-md col-xs-12 col-sm-8 col-md-5 col-lg-4 q-gutter-md"
    >
      <q-avatar
        icon="warning"
        color="primary"
        text-color="white"
        size="100px"
      />
      <div class="text-body1 text-center">
        {{ t(`error.${knownError}`) }}
      </div>
    </div>

    <div
      v-else-if="view && !view.enabled"
      class="column justify-center items-center q-pa-md col-xs-12 col-sm-8 col-md-5 col-lg-4 q-gutter-md"
    >
      <q-avatar
        icon="event_busy"
        color="primary"
        text-color="white"
        size="100px"
      />
      <div
        v-if="event"
        class="text-h5 text-center text-weight-medium"
      >
        {{ to(event.name) }}
      </div>
      <div class="text-body1 text-center">
        {{ t('notPublished') }}
      </div>
    </div>

    <div
      v-else-if="view?.enabled"
      class="col-12 col-md-8 col-lg-6 q-py-lg q-px-md"
    >
      <div
        v-if="event"
        class="text-h5 q-mb-md"
      >
        {{ to(event.name) }}
      </div>

      <public-program-calendar
        :date="view.date"
        :min-date="view.minDate"
        :max-date="view.maxDate"
        :published="view.published"
        :plan="view.published ? view.plan : null"
        :items="view.published ? view.items : []"
        :timezone="event?.timezone ?? 'UTC'"
        @previous="jumpToDate(addDays(view.date, -1))"
        @next="jumpToDate(addDays(view.date, 1))"
      />
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useMeta } from 'quasar';
import { useI18n } from 'vue-i18n';
import type {
  EventDetails,
  ProgramPublicView,
} from '@camp-registration/common/entities';
import { clampDate } from '@camp-registration/common/utils';
import { addDays } from '@/utils/date';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import PublicProgramCalendar from '@/components/event/programPlanner/PublicProgramCalendar.vue';
import { isAPIServiceError, useAPIService } from '@/services/APIService';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useProgramPublicStream } from '@/composables/programPublicStream';

const { t } = useI18n();
const { to } = useObjectTranslation();
const api = useAPIService();
const { extractErrorText } = useErrorExtractor();

const { eventId } = defineProps<{
  eventId: string;
}>();

const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const knownError = ref<'unavailable' | 'not_found' | null>(null);
const event = ref<EventDetails | undefined>();
const view = ref<ProgramPublicView | undefined>();

// `undefined` on the very first request — the backend then defaults to today
// if the event is running, otherwise its first day. Once a view comes back,
// every further fetch (browsing, or a realtime refetch) asks for the same
// day again, so a live update never yanks the viewer back to today.
let selectedDate: string | undefined;

useMeta(() => ({
  title: event.value ? to(event.value.name) : '',
}));

onMounted(async () => {
  try {
    loading.value = true;

    event.value = await api.fetchEvent(eventId, {
      skipAuthenticationHandler: true,
    });
    await fetchView();

    // Reactive: refetch the public view on every relevant change (item edits,
    // and the `program-public` setting itself — the master switch, or which
    // days/plans are published). The stream stays open regardless of
    // `enabled`, so a viewer on the "not published yet" state learns the
    // instant it changes.
    useProgramPublicStream(eventId, () => {
      void fetchView();
    });
  } catch (err) {
    event.value = undefined;

    if (!isAPIServiceError(err)) {
      error.value = extractErrorText(err);
      return;
    }

    switch (err.response?.status) {
      case 401:
      case 403:
        knownError.value = 'unavailable';
        break;
      case 404:
        knownError.value = 'not_found';
        break;
      default:
        error.value = extractErrorText(err);
    }
  } finally {
    loading.value = false;
  }
});

async function fetchView() {
  try {
    const fetched = await api.fetchProgramPublicView(eventId, {
      date: selectedDate,
      skipAuthenticationHandler: true,
    });

    view.value = fetched;
    if (fetched.enabled) {
      selectedDate = fetched.date;
    }
  } catch {
    // Transient refetch failures keep the last known view rather than
    // replacing it with an error state.
  }
}

function jumpToDate(date: string) {
  if (!view.value?.enabled) {
    return;
  }

  selectedDate = clampDate(date, view.value.minDate, view.value.maxDate);
  void fetchView();
}
</script>

<i18n lang="yaml" locale="en">
notPublished: 'The program has not been published yet.'
error:
  unavailable: 'This program is not available.'
  not_found: 'This event could not be found.'
</i18n>

<i18n lang="yaml" locale="de">
notPublished: 'Das Programm wurde noch nicht veröffentlicht.'
error:
  unavailable: 'Dieses Programm ist nicht verfügbar.'
  not_found: 'Diese Veranstaltung wurde nicht gefunden.'
</i18n>

<i18n lang="yaml" locale="fr">
notPublished: "Le programme n'a pas encore été publié."
error:
  unavailable: "Ce programme n'est pas disponible."
  not_found: 'Cet événement est introuvable.'
</i18n>

<i18n lang="yaml" locale="pl">
notPublished: 'Program nie został jeszcze opublikowany.'
error:
  unavailable: 'Ten program jest niedostępny.'
  not_found: 'Nie znaleziono tego wydarzenia.'
</i18n>

<i18n lang="yaml" locale="cs">
notPublished: 'Program ještě nebyl zveřejněn.'
error:
  unavailable: 'Tento program není dostupný.'
  not_found: 'Tuto akci se nepodařilo najít.'
</i18n>
