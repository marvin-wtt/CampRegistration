<template>
  <page-state-handler
    :loading
    :error
    class="row justify-center"
    :style="{ backgroundColor: bgColor }"
  >
    <template v-if="event && registrationFormVisible">
      <div
        v-if="group !== undefined"
        class="event-page__content full-width"
      >
        <!-- In the floating header, so the form's own header keeps the top. -->
        <teleport
          v-if="group && formActive && event.countries.length > 1"
          to="#event-header-actions"
          defer
        >
          <q-btn
            flat
            dense
            rounded
            no-caps
            class="event-page__group"
            :aria-label="t('group.current', { group: groupName })"
            data-test="registration-group"
          >
            <country-icon :country="group" />
            <span class="gt-xs q-ml-sm">{{ groupName }}</span>
            <q-menu>
              <q-list style="min-width: 220px">
                <q-item-label header>
                  {{ t('group.current', { group: groupName }) }}
                </q-item-label>
                <q-item
                  v-close-popup
                  clickable
                  data-test="registration-group-change"
                  @click="changeGroup"
                >
                  <q-item-section avatar>
                    <q-icon name="swap_horiz" />
                  </q-item-section>
                  <q-item-section>{{ t('group.change') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <!-- The group belongs to this page; what follows, to the app. -->
          <q-separator
            vertical
            class="event-page__group-separator"
          />
        </teleport>
        <!-- Keyed: a new group or a new registrant needs a new form. -->
        <registration-form
          :key="`${group ?? ''}-${formRun}`"
          :event-details="event"
          :group
          :submit-fn="submit"
          :upload-file-fn="uploadFile"
          class="full-width"
          @bg-color-update="(color) => updateBgColor(color)"
          @active-change="(active) => (formActive = active)"
          @restart="registerAnother"
        />
        <privacy-notice-disclosure
          v-if="formActive"
          :event-id="event.id"
          class="event-page__privacy"
        />
      </div>

      <registration-group-select
        v-else
        :event
        @select="chooseGroup"
      />
    </template>

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
          v-for="email in eventContactEmails"
          :key="email"
          :href="`mailto:${email}`"
          :label="email"
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
import { useMeta, useQuasar } from 'quasar';
import { useObjectTranslation } from '@/composables/objectTranslation';
import RegistrationForm from '@/components/common/RegistrationForm.vue';
import RegistrationGroupSelect from '@/components/listedEvents/RegistrationGroupSelect.vue';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import PrivacyNoticeDisclosure from '@/components/privacy/PrivacyNoticeDisclosure.vue';
import { countryName } from '@/utils/countries';
import {
  type EventDetails,
  type EventRegistrationStatus,
} from '@camp-registration/common/entities';
import { allCountryValues } from '@camp-registration/common/utils';
import { isAPIServiceError, useAPIService } from '@/services/APIService';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { usePermissions } from '@/composables/permissions';

const { t, d, locale } = useI18n();
const { to } = useObjectTranslation();
const api = useAPIService();
const route = useRoute();
const router = useRouter();
const quasar = useQuasar();
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

// The group the form is filled in for, chosen before the form and kept in
// `?group=` so a link can preselect it and a reload keeps it. Undefined while
// a multi-country event still needs the choice.
const group = computed<string | null | undefined>(() => {
  const countries = event.value?.countries ?? [];
  if (countries.length <= 1) {
    return countries[0] ?? null;
  }

  const query = route.query.group;
  const selected = typeof query === 'string' ? query.toLowerCase() : null;

  return selected && countries.includes(selected) ? selected : undefined;
});

// A new form starts active; the previous one may have ended in its
// submitted state.
watch(group, () => {
  formActive.value = true;
});

const groupName = computed<string>(() =>
  group.value ? countryName(group.value, locale.value) : '',
);

function chooseGroup(group: string) {
  // A history entry, so going back returns to the choice.
  void router.push({ query: { ...route.query, group } });
}

// Every answer was given to the old group's form — its texts, files and terms
// — so nothing carries over: the form is keyed by the group.
function changeGroup() {
  quasar
    .dialog({
      component: ConfirmDialog,
      componentProps: {
        title: t('group.dialog.title'),
        message: t('group.dialog.message'),
        okLabel: t('group.change'),
      },
    })
    .onOk(backToGroupChoice);
}

function backToGroupChoice() {
  const query = { ...route.query };
  delete query.group;
  void router.push({ query });
}

// Bumped to start an empty form for the same group.
const formRun = ref<number>(0);

// The next person may belong to another group, so a multi-country event asks
// again; otherwise the form simply starts over.
function registerAnother() {
  if ((event.value?.countries.length ?? 0) > 1) {
    backToGroupChoice();
    return;
  }

  formRun.value += 1;
  formActive.value = true;
  window.scrollTo({ top: 0 });
}

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

// The visitor's group is unknown here, so every group's contact is listed.
const eventContactEmails = computed<string[]>(() => {
  if (!event.value?.contactEmail) {
    return [];
  }

  return allCountryValues(event.value.contactEmail).filter(Boolean);
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
  return api.createRegistration(eventId, {
    data: formData,
    locale,
    group: group.value ?? null,
  });
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

.event-page__group {
  padding: 0 0.75rem;
}

.event-page__group-separator {
  align-self: center;
  height: 20px;
  margin: 0 4px;
}

// Keeps the disclosure at the bottom edge for short forms instead of stranding
// it mid-page; with a long form the auto margin collapses to zero.
.event-page__privacy {
  margin-top: auto;
}
</style>

<i18n lang="yaml" locale="en">
group:
  current: 'Group: {group}'
  change: 'Change group'
  dialog:
    title: 'Change group?'
    message: "The form is reset: every answer you have given so far is cleared, since it belongs to this group's form."

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
group:
  current: 'Gruppe: {group}'
  change: 'Gruppe wechseln'
  dialog:
    title: 'Gruppe wechseln?'
    message: 'Das Formular wird zurückgesetzt: Alle deine bisherigen Angaben werden gelöscht, da sie zum Formular dieser Gruppe gehören.'

action:
  open_form_for_manager: 'Als Veranstaltungsmanager öffnen'

date:
  opens: 'Öffnet am {date}'

error:
  upcoming: 'Die Anmeldung für diese Veranstaltung hat noch nicht begonnen.'
  closed: 'Die Anmeldung für diese Veranstaltung ist bereits geschlossen.'
  unavailable: 'Diese Veranstaltung ist nicht verfügbar.'
  not_found: 'Die gesuchte Veranstaltung konnte nicht gefunden werden. Bitte überprüfe die URL.'
</i18n>

<i18n lang="yaml" locale="fr">
group:
  current: 'Groupe : {group}'
  change: 'Changer de groupe'
  dialog:
    title: 'Changer de groupe ?'
    message: 'Le formulaire est réinitialisé : toutes tes réponses sont effacées, car elles appartiennent au formulaire de ce groupe.'

action:
  open_form_for_manager: 'Ouvrir comme gestionnaire'

date:
  opens: 'Ouvre le {date}'

error:
  upcoming: "L'inscription à cet événement n'a pas encore commencé."
  closed: "L'inscription à cet événement est déjà terminée."
  unavailable: "Cet événement n'est pas disponible."
  not_found: "L'événement que vous recherchez est introuvable. Veuillez vérifier l'URL."
</i18n>

<i18n lang="yaml" locale="pl">
group:
  current: 'Grupa: {group}'
  change: 'Zmień grupę'
  dialog:
    title: 'Zmienić grupę?'
    message: 'Formularz zostanie zresetowany: wszystkie dotychczasowe odpowiedzi zostaną usunięte, ponieważ należą do formularza tej grupy.'

action:
  open_form_for_manager: 'Otwórz jako menedżer'

date:
  opens: 'Otwiera się {date}'

error:
  upcoming: 'Rejestracja na ten wydarzenie jeszcze się nie rozpoczęła.'
  closed: 'Rejestracja na ten wydarzenie jest już zamknięta.'
  unavailable: 'Ten wydarzenie jest niedostępny.'
  not_found: 'Nie znaleziono szukanego wydarzenia. Sprawdź adres URL.'
</i18n>

<i18n lang="yaml" locale="cs">
group:
  current: 'Skupina: {group}'
  change: 'Změnit skupinu'
  dialog:
    title: 'Změnit skupinu?'
    message: 'Formulář se vynuluje: všechny dosavadní odpovědi budou smazány, protože patří k formuláři této skupiny.'

action:
  open_form_for_manager: 'Otevřít jako správce'

date:
  opens: 'Otevírá se {date}'

error:
  upcoming: 'Registrace na tuto akci ještě nezačala.'
  closed: 'Registrace na tuto akci je již uzavřena.'
  unavailable: 'Tato akce není dostupná.'
  not_found: 'Požadovaná akce nebyla nalezena. Zkontrolujte prosím URL adresu.'
</i18n>
