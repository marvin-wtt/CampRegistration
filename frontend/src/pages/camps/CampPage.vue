<template>
  <page-state-handler
    :loading
    :error
    class="row justify-center"
    :style="{ backgroundColor: bgColor }"
  >
    <registration-form
      v-if="camp && registrationStatus === 'open'"
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
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useMeta } from 'quasar';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import RegistrationForm from 'components/common/RegistrationForm.vue';
import type { CampDetails } from '@camp-registration/common/entities';
import { isAPIServiceError, useAPIService } from 'src/services/APIService';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useErrorExtractor } from 'src/composables/serviceHandler';

const { t, d } = useI18n();
const { to } = useObjectTranslation();
const api = useAPIService();
const route = useRoute();
const { extractErrorText } = useErrorExtractor();

const bgColor = ref<string>();
const camp = ref<CampDetails | undefined>();
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const knownError = ref<'unavailable' | 'not_found' | null>(null);
const now = ref(new Date());

let openTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => camp.value?.registrationOpensAt,
  (opensAt) => {
    if (openTimer !== null) {
      clearTimeout(openTimer);
      openTimer = null;
    }
    if (!opensAt) {
      return;
    }
    const delay = new Date(opensAt).getTime() - Date.now();
    const offset = 1000;
    if (delay > 0) {
      openTimer = setTimeout(() => {
        now.value = new Date();
      }, delay + offset);
    }
  },
);

onUnmounted(() => {
  if (openTimer !== null) {
    clearTimeout(openTimer);
  }
});

onMounted(async () => {
  await init();
});

useMeta(() => {
  return {
    title: to(camp.value?.name),
  };
});

async function init() {
  try {
    loading.value = true;

    const id = route.params.camp;
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

type RegistrationStatus =
  | 'open'
  | 'not_open'
  | 'closed'
  | 'unavailable'
  | 'not_found';

const registrationStatus = computed<RegistrationStatus>(() => {
  if (knownError.value) {
    return knownError.value;
  }
  if (!camp.value) {
    return 'not_found';
  }

  const { registrationOpensAt, registrationClosesAt } = camp.value;

  if (!registrationOpensAt && !registrationClosesAt) {
    return 'closed';
  }

  if (registrationOpensAt && now.value < new Date(registrationOpensAt)) {
    return 'not_open';
  }

  if (registrationClosesAt && now.value > new Date(registrationClosesAt)) {
    return 'closed';
  }

  return 'open';
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
    case 'not_open':
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
    registrationStatus.value === 'not_open' &&
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
    case 'not_open':
      return t('error.not_open');
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
</script>

<i18n lang="yaml" locale="en">
date:
  opens: 'Opens on {date}'

error:
  not_open: 'Registration for this camp has not opened yet.'
  closed: 'Registration for this camp is already closed.'
  unavailable: 'This camp is not available.'
  not_found: 'The camp you are looking for could not be found. Please check the URL.'
</i18n>

<i18n lang="yaml" locale="de">
date:
  opens: 'Öffnet am {date}'

error:
  not_open: 'Die Anmeldung für dieses Camp hat noch nicht begonnen.'
  closed: 'Die Anmeldung für dieses Camp ist bereits geschlossen.'
  unavailable: 'Dieses Camp ist nicht verfügbar.'
  not_found: 'Das gesuchte Camp konnte nicht gefunden werden. Bitte überprüfen Sie die URL.'
</i18n>

<i18n lang="yaml" locale="fr">
date:
  opens: 'Ouvre le {date}'

error:
  not_open: "L'inscription à ce camp n'a pas encore commencé."
  closed: "L'inscription à ce camp est déjà terminée."
  unavailable: "Ce camp n'est pas disponible."
  not_found: "Le camp que vous recherchez est introuvable. Veuillez vérifier l'URL."
</i18n>

<i18n lang="yaml" locale="pl">
date:
  opens: 'Otwiera się {date}'

error:
  not_open: 'Rejestracja na ten obóz jeszcze się nie rozpoczęła.'
  closed: 'Rejestracja na ten obóz jest już zamknięta.'
  unavailable: 'Ten obóz jest niedostępny.'
  not_found: 'Nie znaleziono szukanego obozu. Sprawdź adres URL.'
</i18n>

<i18n lang="yaml" locale="cs">
date:
  opens: 'Otevírá se {date}'

error:
  not_open: 'Registrace na tento tábor ještě nezačala.'
  closed: 'Registrace na tento tábor je již uzavřena.'
  unavailable: 'Tento tábor není dostupný.'
  not_found: 'Požadovaný tábor nebyl nalezen. Zkontrolujte prosím URL adresu.'
</i18n>
