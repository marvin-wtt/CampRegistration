<template>
  <page-state-handler
    :loading
    :error
    class="row justify-center"
    :style="{ backgroundColor: bgColor }"
  >
    <registration-form
      v-if="camp"
      :camp-details="camp"
      :submit-fn="submit"
      :upload-file-fn="uploadFile"
      class="col-xs-12 col-sm-12 col-md-8 col-lg-6 col-xl-6"
      @bg-color-update="(color) => updateBgColor(color)"
    />

    <!-- Not available -->
    <div
      v-else
      class="column justify-center q-pa-md col-xs-12 col-sm-8 col-md-5 col-lg-3"
    >
      <div class="col-shrink column q-gutter-lg">
        <div class="col-shrink self-center">
          <q-avatar
            :icon="knownErrorIcon"
            color="primary"
            text-color="white"
            size="100px"
          />
        </div>

        <div class="col text-h6 text-center">
          {{ knownErrorText }}
        </div>

        <div class="col-shrink row justify-center">
          <q-btn
            :label="t('action.home')"
            icon="search"
            :to="{ name: 'camps' }"
            color="primary"
            rounded
          />
        </div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { computed, onMounted, ref } from 'vue';
import { useMeta } from 'quasar';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import RegistrationForm from 'components/common/RegistrationForm.vue';
import type { CampDetails } from '@camp-registration/common/entities';
import { isAPIServiceError, useAPIService } from 'src/services/APIService';
import { useRoute } from 'vue-router';
import { v7 as uuid } from 'uuid';
import { useI18n } from 'vue-i18n';
import { useErrorExtractor } from 'src/composables/serviceHandler';

const { t } = useI18n();
const { to } = useObjectTranslation();
const api = useAPIService();
const route = useRoute();
const { extractErrorText } = useErrorExtractor();

const bgColor = ref<string>();
const camp = ref<CampDetails | undefined>();
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const knownError = ref<'unavailable' | 'not_found' | null>(null);

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

const knownErrorIcon = computed<string>(() => {
  return knownError.value === 'unavailable' ? 'event_busy' : 'warning';
});

const knownErrorText = computed<string>(() => {
  if (knownError.value === 'unavailable') {
    return t('error.unavailable');
  }

  if (knownError.value === 'not_found') {
    return t('error.not_found');
  }

  return 'Unknown error occurred';
});

async function submit(campId: string, formData: Record<string, unknown>) {
  await api.createRegistration(campId, { data: formData });
}

async function uploadFile(file: File): Promise<string> {
  const serviceFile = await api.createTemporaryFile({
    file,
    field: uuid(),
  });

  if (serviceFile.field) {
    return `${serviceFile.id}#${serviceFile.field}`;
  }

  return serviceFile.id;
}

function updateBgColor(color: string | undefined) {
  bgColor.value = color;
}
</script>

<i18n lang="yaml" locale="en">
action:
  home: 'Look for other camps'

error:
  unavailable: "Registration for this camp is not yet possible or is already
    closed. Please check the camp's registration dates. If you believe that this
    is a mistake, please contact the camp administration."
  not_found: 'The camp you are looking for could not be found. Please check the
    URL or contact the camp administration.'
</i18n>

<i18n lang="yaml" locale="de">
action:
  home: 'Nach anderen Camps suchen'

error:
  unavailable: 'Die Anmeldung für dieses Camp ist noch nicht möglich oder ist
    bereits geschlossen. Bitte überprüfen Sie die Anmeldedaten des Camps.
    Wenn Sie glauben, dass es sich hierbei um einen Fehler handelt, wenden Sie
    sich bitte an die Camp-Verwaltung.'
  not_found:
    'Das gesuchte Camp konnte nicht gefunden werden. Bitte überprüfen Sie die
    URL oder wenden Sie sich an die Camp-Verwaltung.'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  home: "Chercher d'autres camps"

error:
  unavailable: "L'inscription à ce camp n'est pas encore possible ou est déjà
    terminée. Veuillez vérifier les dates d'inscription du camp. Si vous pensez
    qu'il s'agit d'une erreur, veuillez contacter l'administration du camp."
  not_found: "Le camp que vous recherchez est introuvable. Veuillez vérifier l'
    URL ou contacter l'administration du camp."
</i18n>

<i18n lang="yaml" locale="pl">
action:
  home: 'Szukaj innych obozów'

error:
  unavailable: 'Rejestracja na ten obóz nie jest jeszcze możliwa lub została już zamknięta. Sprawdź dane rejestracyjne obozu. Jeśli uważasz, że to błąd, skontaktuj się z administracją obozu.'
  not_found: 'Nie znaleziono szukanego obozu. Sprawdź adres URL lub skontaktuj się z administracją obozu.'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  home: 'Hledat jiné tábory'

error:
  unavailable: 'Registrace na tento tábor zatím není možná nebo již byla uzavřena. Zkontrolujte registrační údaje tábora. Pokud si myslíte, že jde o chybu, kontaktujte správu tábora.'
  not_found: 'Požadovaný tábor nebyl nalezen. Zkontrolujte prosím URL adresu nebo kontaktujte správu tábora.'
</i18n>
