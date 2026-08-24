<template>
  <page-state-handler
    :loading
    :error
    class="row justify-center"
    :style="{ backgroundColor: bgColor }"
  >
    <div
      v-if="event && registrationFormVisible"
      class="event-page__content full-width"
    >
      <registration-form
        :event-details="event"
        :submit-fn="submit"
        :upload-file-fn="uploadFile"
        class="full-width"
        @bg-color-update="(color) => updateBgColor(color)"
        @active-change="(active) => (formActive = active)"
      />
      <privacy-notice-disclosure
        v-if="formActive"
        :event-id="event.id"
        class="event-page__privacy"
      />
    </div>

    <!-- Not available / registration closed -->
    <div
      v-else
      class="column justify-center q-pa-md col-xs-12 col-sm-8 col-md-5 col-lg-4"
      :data-test="`event-registration-status-${registrationStatus}`"
    >
      <div class="col-shrink column items-center q-gutter-md">
        <q-avatar
          :icon="statusIcon"
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
          {{ statusText }}
        </div>

        <div
          v-if="statusDate"
          class="text-body2 text-center text-grey-7"
        >
          {{ statusDate }}
        </div>

        <q-btn
          v-if="eventContactEmail"
          :href="`mailto:${eventContactEmail}`"
          :label="eventContactEmail"
          icon="mail"
          type="a"
          flat
          rounded
          color="primary"
        />

        <q-btn
          v-if="canCreateRegistrationAsManager"
          :label="t('action.open_form_for_manager')"
          color="primary"
          icon="lock_open"
          rounded
          @click="enableManagerRegistrationOverride()"
        />
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useMeta } from 'quasar';
import { useObjectTranslation } from '@/composables/objectTranslation';
import RegistrationForm from '@/components/common/RegistrationForm.vue';
import PrivacyNoticeDisclosure from '@/components/privacy/PrivacyNoticeDisclosure.vue';
import {
  type EventDetails,
  type EventRegistrationStatus,
} from '@camp-registration/common/entities';
import { isAPIServiceError, useAPIService } from '@/services/APIService';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { usePermissions } from '@/composables/permissions';

const { t, d } = useI18n();
const { to } = useObjectTranslation();
const api = useAPIService();
const route = useRoute();
const { extractErrorText } = useErrorExtractor();
const { canFor } = usePermissions();

const managerRegistrationOverrideEnabled = ref<boolean>(false);
const formActive = ref<boolean>(true);
const bgColor = ref<string>();
const event = ref<EventDetails | undefined>();
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const knownError = ref<'unavailable' | 'not_found' | null>(null);

let openTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(async () => {
  await loadEvent();
});

onUnmounted(() => {
  stopRegistrationOpenTimer();
});

watch(
  [
    () => event.value?.registrationOpensAt,
    () => event.value?.registrationClosesAt,
  ],
  ([openAt, closeAt]) => startRegistrationOpenTimer(openAt, closeAt),
);

useMeta(() => {
  return {
    title: to(event.value?.name),
  };
});

const registrationFormVisible = computed<boolean>(() => {
  return (
    registrationStatus.value === 'open' ||
    managerRegistrationOverrideEnabled.value
  );
});

const canCreateRegistrationAsManager = computed<boolean>(() => {
  return (
    event.value !== undefined &&
    canFor(event.value.id, 'event.registrations.create')
  );
});

async function loadEvent() {
  try {
    loading.value = true;

    const id = route.params.eventId;
    if (typeof id !== 'string') {
      error.value = 'Invalid route params. Missing event id.';
      return;
    }

    event.value = await api.fetchEvent(id, {
      skipAuthenticationHandler: true,
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
}

type RegistrationStatus = EventRegistrationStatus | 'unavailable' | 'not_found';

const registrationStatus = computed<RegistrationStatus>(() => {
  if (knownError.value) {
    return knownError.value;
  }

  if (!event.value) {
    return 'not_found';
  }

  return event.value.registrationStatus;
});

const eventContactEmail = computed<string | null>(() => {
  if (!event.value?.contactEmail) {
    return null;
  }

  const email = event.value.contactEmail;
  return typeof email === 'string' ? email : (Object.values(email)[0] ?? null);
});

const statusIcon = computed<string>(() => {
  switch (registrationStatus.value) {
    case 'upcoming':
      return 'schedule';
    case 'closed':
      return 'event_busy';
    case 'not_found':
      return 'warning';
    default:
      return 'lock';
  }
});

const statusDate = computed<string | null>(() => {
  if (
    registrationStatus.value === 'upcoming' &&
    event.value?.registrationOpensAt
  ) {
    return t('date.opens', {
      date: d(event.value.registrationOpensAt, 'dateTime'),
    });
  }
  return null;
});

const statusText = computed<string>(() => {
  switch (registrationStatus.value) {
    case 'upcoming':
      return t('error.upcoming');
    case 'closed':
      return t('error.closed');
    case 'not_found':
      return t('error.not_found');
    default:
      return t('error.unavailable');
  }
});

async function submit(
  eventId: string,
  formData: Record<string, unknown>,
  locale: string,
) {
  await api.createRegistration(eventId, { data: formData, locale });
}

async function uploadFile(file: File): Promise<string> {
  const serviceFile = await api.createTemporaryFile({
    file,
  });

  return serviceFile.id;
}

function updateBgColor(color: string | undefined) {
  bgColor.value = color;
}

function startRegistrationOpenTimer(
  opensAt: string | null | undefined,
  closesAt: string | null | undefined,
) {
  stopRegistrationOpenTimer();

  const offset = 1000;

  for (const timestamp of [opensAt, closesAt]) {
    if (!timestamp) {
      continue;
    }

    const delay = new Date(timestamp).getTime() - Date.now();
    // Use negative offset to avoid data race between the status and the timestamp
    if (delay < -offset) {
      continue;
    }

    openTimer = setTimeout(
      () => {
        void loadEvent();
      },
      Math.max(delay, 0) + offset,
    );

    return;
  }
}

function stopRegistrationOpenTimer() {
  if (openTimer !== null) {
    clearTimeout(openTimer);
    openTimer = null;
  }
}

function enableManagerRegistrationOverride() {
  managerRegistrationOverrideEnabled.value = true;
}
</script>

<style lang="scss" scoped>
// No min-height here: the q-page is a flex row, so this stretches to its
// content box on its own. Copying the page's min-height would add up with the
// layout's top padding and push the footer below the fold.
.event-page__content {
  display: flex;
  flex-direction: column;
}

// Keeps the disclosure at the bottom edge for short forms instead of stranding
// it mid-page; with a long form the auto margin collapses to zero.
.event-page__privacy {
  margin-top: auto;
}
</style>

<i18n lang="yaml" locale="en">
action:
  open_form_for_manager: 'Open form as manager'

date:
  opens: 'Opens on {date}'

error:
  upcoming: 'Registration for this event has not opened yet.'
  closed: 'Registration for this event is already closed.'
  unavailable: 'This event is not available.'
  not_found: 'The event you are looking for could not be found. Please check the URL.'
</i18n>

<i18n lang="yaml" locale="de">
action:
  open_form_for_manager: 'Als Event-Manager öffnen'

date:
  opens: 'Öffnet am {date}'

error:
  upcoming: 'Die Anmeldung für dieses Event hat noch nicht begonnen.'
  closed: 'Die Anmeldung für dieses Event ist bereits geschlossen.'
  unavailable: 'Dieses Event ist nicht verfügbar.'
  not_found: 'Das gesuchte Event konnte nicht gefunden werden. Bitte überprüfen Sie die URL.'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  open_form_for_manager: 'Ouvrir comme gestionnaire'

date:
  opens: 'Ouvre le {date}'

error:
  upcoming: "L'inscription à ce event n'a pas encore commencé."
  closed: "L'inscription à ce event est déjà terminée."
  unavailable: "Ce event n'est pas disponible."
  not_found: "Le event que vous recherchez est introuvable. Veuillez vérifier l'URL."
</i18n>

<i18n lang="yaml" locale="pl">
action:
  open_form_for_manager: 'Otwórz jako menedżer'

date:
  opens: 'Otwiera się {date}'

error:
  upcoming: 'Rejestracja na ten obóz jeszcze się nie rozpoczęła.'
  closed: 'Rejestracja na ten obóz jest już zamknięta.'
  unavailable: 'Ten obóz jest niedostępny.'
  not_found: 'Nie znaleziono szukanego obozu. Sprawdź adres URL.'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  open_form_for_manager: 'Otevřít jako správce'

date:
  opens: 'Otevírá se {date}'

error:
  upcoming: 'Registrace na tento tábor ještě nezačala.'
  closed: 'Registrace na tento tábor je již uzavřena.'
  unavailable: 'Tento tábor není dostupný.'
  not_found: 'Požadovaný tábor nebyl nalezen. Zkontrolujte prosím URL adresu.'
</i18n>
