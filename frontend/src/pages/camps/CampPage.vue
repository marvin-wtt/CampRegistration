<template>
  <page-state-handler
    :loading
    :error
    class="row justify-center"
    :style="{ backgroundColor: bgColor }"
  >
    <registration-form
      v-if="camp && registrationFormVisible"
      :camp-details="camp"
      :submit-fn="submit"
      :upload-file-fn="uploadFile"
      class="col-xs-12 col-sm-12 col-md-8 col-lg-6 col-xl-6"
      @bg-color-update="(color) => updateBgColor(color)"
    />

    <!-- Not available / registration closed -->
    <div
      v-else
      class="column justify-center q-pa-md col-xs-12 col-sm-8 col-md-5 col-lg-3"
    >
      <div class="col-shrink column items-center q-gutter-md">
        <q-avatar
          :icon="statusIcon"
          color="primary"
          text-color="white"
          size="100px"
        />

        <div
          v-if="camp"
          class="text-h5 text-center text-weight-medium"
        >
          {{ to(camp.name) }}
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
          v-if="campContactEmail"
          :href="`mailto:${campContactEmail}`"
          :label="campContactEmail"
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
import {
  type CampDetails,
  type CampRegistrationStatus,
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
const bgColor = ref<string>();
const camp = ref<CampDetails | undefined>();
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const knownError = ref<'unavailable' | 'not_found' | null>(null);

let openTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(async () => {
  await loadCamp();
});

onUnmounted(() => {
  stopRegistrationOpenTimer();
});

watch(
  [
    () => camp.value?.registrationOpensAt,
    () => camp.value?.registrationClosesAt,
  ],
  ([openAt, closeAt]) => startRegistrationOpenTimer(openAt, closeAt),
);

useMeta(() => {
  return {
    title: to(camp.value?.name),
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
    camp.value !== undefined &&
    canFor(camp.value.id, 'camp.registrations.create')
  );
});

async function loadCamp() {
  try {
    loading.value = true;

    const id = route.params.campId;
    if (typeof id !== 'string') {
      error.value = 'Invalid route params. Missing camp id.';
      return;
    }

    camp.value = await api.fetchCamp(id, {
      skipAuthenticationHandler: true,
    });
  } catch (err) {
    camp.value = undefined;

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

type RegistrationStatus = CampRegistrationStatus | 'unavailable' | 'not_found';

const registrationStatus = computed<RegistrationStatus>(() => {
  if (knownError.value) {
    return knownError.value;
  }

  if (!camp.value) {
    return 'not_found';
  }

  return camp.value.registrationStatus;
});

const campContactEmail = computed<string | null>(() => {
  if (!camp.value?.contactEmail) {
    return null;
  }

  const email = camp.value.contactEmail;
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
    camp.value?.registrationOpensAt
  ) {
    return t('date.opens', {
      date: d(camp.value.registrationOpensAt, 'dateTime'),
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
  campId: string,
  formData: Record<string, unknown>,
  locale: string,
) {
  await api.createRegistration(campId, { data: formData, locale });
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
        void loadCamp();
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

<i18n lang="yaml" locale="en">
action:
  open_form_for_manager: 'Open form as manager'

date:
  opens: 'Opens on {date}'

error:
  upcoming: 'Registration for this camp has not opened yet.'
  closed: 'Registration for this camp is already closed.'
  unavailable: 'This camp is not available.'
  not_found: 'The camp you are looking for could not be found. Please check the URL.'
</i18n>

<i18n lang="yaml" locale="de">
action:
  open_form_for_manager: 'Als Camp-Manager öffnen'

date:
  opens: 'Öffnet am {date}'

error:
  upcoming: 'Die Anmeldung für dieses Camp hat noch nicht begonnen.'
  closed: 'Die Anmeldung für dieses Camp ist bereits geschlossen.'
  unavailable: 'Dieses Camp ist nicht verfügbar.'
  not_found: 'Das gesuchte Camp konnte nicht gefunden werden. Bitte überprüfen Sie die URL.'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  open_form_for_manager: 'Ouvrir comme gestionnaire'

date:
  opens: 'Ouvre le {date}'

error:
  upcoming: "L'inscription à ce camp n'a pas encore commencé."
  closed: "L'inscription à ce camp est déjà terminée."
  unavailable: "Ce camp n'est pas disponible."
  not_found: "Le camp que vous recherchez est introuvable. Veuillez vérifier l'URL."
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
