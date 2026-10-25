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
            :aria-label="`${t('group.current', { group: groupName })}. ${t('group.change')}`"
            data-test="registration-group"
            @click="changeGroup"
          >
            <country-icon :country="group" />
            <span class="gt-xs q-ml-sm">{{ groupName }}</span>
            <q-icon
              name="swap_horiz"
              size="xs"
              class="q-ml-xs"
            />
            <q-tooltip>{{ t('group.change') }}</q-tooltip>
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
      <div
        v-if="event"
        class="event-page__status column no-wrap"
      >
        <event-identity :event />

        <div
          class="event-page__notice row no-wrap items-center rounded-xl q-pa-md"
          data-test="event-registration-notice"
        >
          <q-icon
            :name="statusIcon"
            size="md"
            class="q-mr-md"
          />
          <div>
            <div class="text-body1 text-weight-medium">
              {{ statusText }}
            </div>
            <div
              v-if="statusDate"
              class="text-body2"
            >
              {{ statusDate }}
            </div>
          </div>
        </div>

        <section
          v-if="eventContacts.length > 0"
          class="event-page__contacts"
        >
          <div class="text-subtitle2 text-on-surface-variant q-mb-sm q-ml-md">
            {{ t('contact.title') }}
          </div>
          <q-list
            bordered
            separator
            class="event-page__contact-list rounded-xl"
          >
            <q-item
              v-for="contact in eventContacts"
              :key="contact.email"
              :href="`mailto:${contact.email}`"
              tag="a"
              clickable
              class="event-page__contact"
              data-test="event-contact"
            >
              <q-item-section
                avatar
                class="event-page__contact-avatar"
              >
                <div
                  v-if="contact.groups.length > 0"
                  class="event-page__contact-flags"
                >
                  <country-icon
                    v-for="contactGroup in contact.groups"
                    :key="contactGroup"
                    :country="contactGroup"
                  />
                </div>
                <q-icon
                  v-else
                  name="mail"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  v-if="contact.groups.length > 0"
                  class="text-body1"
                  data-test="event-contact-groups"
                >
                  {{ contactGroupNames(contact.groups) }}
                </q-item-label>
                <q-item-label
                  :caption="contact.groups.length > 0"
                  :class="{ 'text-body1': contact.groups.length === 0 }"
                  class="event-page__contact-email"
                >
                  {{ contact.email }}
                </q-item-label>
              </q-item-section>
              <q-item-section
                v-if="contact.groups.length > 0"
                side
              >
                <q-icon name="mail" />
              </q-item-section>
            </q-item>
          </q-list>
        </section>

        <div
          v-if="canCreateRegistrationAsManager"
          class="column items-center q-gutter-y-xs"
        >
          <m-btn
            primary
            icon="lock_open"
            :label="t('action.open_form_anyway')"
            data-test="registration-override"
            @click="enableManagerRegistrationOverride()"
          />
          <div class="text-caption text-on-surface-variant">
            {{ t('action.open_form_anyway_hint') }}
          </div>
        </div>
      </div>

      <!-- No event to show: not found or not available. -->
      <div
        v-else
        class="col-shrink column items-center q-gutter-md"
      >
        <q-avatar
          :icon="statusIcon"
          color="primary"
          text-color="white"
          size="100px"
        />

        <div class="text-body1 text-center">
          {{ statusText }}
        </div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useMeta, useQuasar } from 'quasar';
import { useObjectTranslation } from '@/composables/objectTranslation';
import RegistrationForm from '@/components/common/RegistrationForm.vue';
import RegistrationGroupSelect from '@/components/listedEvents/RegistrationGroupSelect.vue';
import EventIdentity from '@/components/listedEvents/EventIdentity.vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import PrivacyNoticeDisclosure from '@/components/privacy/PrivacyNoticeDisclosure.vue';
import { countryName } from '@/utils/countries';
import {
  type EventDetails,
  type EventRegistrationStatus,
} from '@camp-registration/common/entities';
import { forGroup } from '@camp-registration/common/utils';
import { isAPIServiceError, useAPIService } from '@/services/APIService';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { usePermissions } from '@/composables/permissions';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';

const { t, d, locale } = useI18n();
const { to } = useObjectTranslation();
const api = useAPIService();
const route = useRoute();
const router = useRouter();
const quasar = useQuasar();
const { extractErrorText } = useErrorExtractor();
const { canFor } = usePermissions();
const { getEnumQueryParam } = useRouteQueryParams();

const managerRegistrationOverrideEnabled = ref<boolean>(false);
const formActive = ref<boolean>(true);
const bgColor = ref<string>();
const event = ref<EventDetails | undefined>();
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const knownError = ref<'unavailable' | 'not_found' | null>(null);

let openTimer: ReturnType<typeof setTimeout> | null = null;

void loadEvent();

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
// an event with several groups still needs the choice.
const group = computed<string | null | undefined>(() => {
  const groups = event.value?.countries ?? [];
  if (groups.length <= 1) {
    return groups[0] ?? null;
  }

  return (
    getEnumQueryParam('group', groups, { caseInsensitive: true }) ?? undefined
  );
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

// The next person may belong to another group, so an event with several asks
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

interface EventContact {
  email: string;
  // The groups it answers for; empty when it is the only contact.
  groups: string[];
}

// A link's `?group=` names the visitor's contact; without one, every group's
// is listed with the groups it answers for.
const eventContacts = computed<EventContact[]>(() => {
  const contactEmail = event.value?.contactEmail;
  if (!contactEmail) {
    return [];
  }

  const own = forGroup(contactEmail, group.value);
  if (own) {
    return [{ email: own, groups: [] }];
  }

  if (typeof contactEmail === 'string') {
    return [];
  }

  const contacts = new Map<string, string[]>();
  for (const [contactGroup, email] of Object.entries(contactEmail)) {
    if (email) {
      contacts.set(email, [...(contacts.get(email) ?? []), contactGroup]);
    }
  }

  return [...contacts].map(([email, groups]) => ({ email, groups }));
});

function contactGroupNames(groups: string[]): string {
  return groups.map((group) => countryName(group, locale.value)).join(', ');
}

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

.event-page__status {
  gap: 16px;

  // Taller than the window, the page scrolls instead of the cards clipping.
  > * {
    flex-shrink: 0;
  }
}

// Tonal, so the status reads as a note about the event rather than a card
// of its own.
.event-page__notice {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.event-page__contacts {
  margin-top: 8px;
}

.event-page__contact-list {
  background: var(--md3-surface-container-low);
  overflow: hidden;
}

// Touch-sized rows, like the group choice.
.event-page__contact {
  min-height: 64px;
}

// Fits two flags, so rows with one or two keep their text aligned.
.event-page__contact-avatar {
  min-width: 64px;
}

.event-page__contact-flags {
  display: flex;
  gap: 4px;
}

.event-page__contact-email {
  overflow-wrap: anywhere;
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
contact:
  title: 'Contact'

group:
  current: 'Group: {group}'
  change: 'Change group'
  dialog:
    title: 'Change group?'
    message: "The form is reset: every answer you have given so far is cleared, since it belongs to this group's form."

action:
  open_form_anyway: 'Open form anyway'
  open_form_anyway_hint: 'Only the event team sees this'

date:
  opens: 'Opens on {date}'

error:
  upcoming: 'Registration for this event has not opened yet.'
  closed: 'Registration for this event is already closed.'
  unavailable: 'This event is not available.'
  not_found: 'The event you are looking for could not be found. Please check the URL.'
</i18n>

<i18n lang="yaml" locale="de">
contact:
  title: 'Kontakt'

group:
  current: 'Gruppe: {group}'
  change: 'Gruppe wechseln'
  dialog:
    title: 'Gruppe wechseln?'
    message: 'Das Formular wird zurückgesetzt: Alle deine bisherigen Angaben werden gelöscht, da sie zum Formular dieser Gruppe gehören.'

action:
  open_form_anyway: 'Formular trotzdem öffnen'
  open_form_anyway_hint: 'Nur für das Veranstaltungsteam sichtbar'

date:
  opens: 'Öffnet am {date}'

error:
  upcoming: 'Die Anmeldung für diese Veranstaltung hat noch nicht begonnen.'
  closed: 'Die Anmeldung für diese Veranstaltung ist bereits geschlossen.'
  unavailable: 'Diese Veranstaltung ist nicht verfügbar.'
  not_found: 'Die gesuchte Veranstaltung konnte nicht gefunden werden. Bitte überprüfe die URL.'
</i18n>

<i18n lang="yaml" locale="fr">
contact:
  title: 'Contact'

group:
  current: 'Groupe : {group}'
  change: 'Changer de groupe'
  dialog:
    title: 'Changer de groupe ?'
    message: 'Le formulaire est réinitialisé : toutes tes réponses sont effacées, car elles appartiennent au formulaire de ce groupe.'

action:
  open_form_anyway: 'Ouvrir le formulaire quand même'
  open_form_anyway_hint: "Visible uniquement par l'équipe de l'événement"

date:
  opens: 'Ouvre le {date}'

error:
  upcoming: "L'inscription à cet événement n'a pas encore commencé."
  closed: "L'inscription à cet événement est déjà terminée."
  unavailable: "Cet événement n'est pas disponible."
  not_found: "L'événement que vous recherchez est introuvable. Veuillez vérifier l'URL."
</i18n>

<i18n lang="yaml" locale="pl">
contact:
  title: 'Kontakt'

group:
  current: 'Grupa: {group}'
  change: 'Zmień grupę'
  dialog:
    title: 'Zmienić grupę?'
    message: 'Formularz zostanie zresetowany: wszystkie dotychczasowe odpowiedzi zostaną usunięte, ponieważ należą do formularza tej grupy.'

action:
  open_form_anyway: 'Otwórz formularz mimo to'
  open_form_anyway_hint: 'Widoczne tylko dla zespołu wydarzenia'

date:
  opens: 'Otwiera się {date}'

error:
  upcoming: 'Rejestracja na ten wydarzenie jeszcze się nie rozpoczęła.'
  closed: 'Rejestracja na ten wydarzenie jest już zamknięta.'
  unavailable: 'Ten wydarzenie jest niedostępny.'
  not_found: 'Nie znaleziono szukanego wydarzenia. Sprawdź adres URL.'
</i18n>

<i18n lang="yaml" locale="cs">
contact:
  title: 'Kontakt'

group:
  current: 'Skupina: {group}'
  change: 'Změnit skupinu'
  dialog:
    title: 'Změnit skupinu?'
    message: 'Formulář se vynuluje: všechny dosavadní odpovědi budou smazány, protože patří k formuláři této skupiny.'

action:
  open_form_anyway: 'Přesto otevřít formulář'
  open_form_anyway_hint: 'Viditelné pouze pro tým akce'

date:
  opens: 'Otevírá se {date}'

error:
  upcoming: 'Registrace na tuto akci ještě nezačala.'
  closed: 'Registrace na tuto akci je již uzavřena.'
  unavailable: 'Tato akce není dostupná.'
  not_found: 'Požadovaná akce nebyla nalezena. Zkontrolujte prosím URL adresu.'
</i18n>
