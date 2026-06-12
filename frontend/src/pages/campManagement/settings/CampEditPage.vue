<template>
  <page-state-handler
    padding
    :prevent-leave
    :error
    :loading
    class="row justify-center"
  >
    <q-form
      greedy
      class="camp-edit col-12 col-md-11 col-lg-10 column q-gutter-y-lg"
      @reset="onReset"
      @submit="onSubmit"
    >
      <!-- Header -->
      <div>
        <div class="text-h5 text-weight-medium">
          {{ t('title.edit') }}
        </div>
        <div class="text-body2 text-grey-6 q-mt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <!-- Two-column card grid -->
      <div class="row q-col-gutter-md items-start">
        <!-- Left column -->
        <div class="col-12 col-md-6 column q-gutter-y-md">
          <!-- General -->
          <q-card
            flat
            bordered
            class="section-card"
          >
            <q-card-section class="q-pb-none">
              <div class="row items-center no-wrap q-gutter-sm">
                <q-icon
                  name="badge"
                  color="primary"
                  size="20px"
                />
                <div class="text-subtitle2 text-weight-bold">
                  {{ t('section.general') }}
                </div>
              </div>
            </q-card-section>

            <q-card-section class="column q-gutter-y-md">
              <!-- Countries -->
              <country-select
                v-model="camp.countries"
                :disable="loading"
                :label="t('field.countries')"
                :countries="['de', 'fr', 'gb', 'pl', 'cz']"
                :rules="[
                  (val?: string[]) =>
                    (val && val.length > 0) || t('validation.countries.empty'),
                ]"
                hide-bottom-space
                outlined
                rounded
                multiple
              >
                <template #before>
                  <q-icon name="language" />
                </template>
              </country-select>

              <!-- Name -->
              <translated-input
                v-model="camp.name"
                :disable="loading"
                :label="t('field.name')"
                :locales="camp.countries"
                :rules="[
                  (val?: string) => !!val || t('validation.name.empty'),
                  (val: string) =>
                    val.length <= 255 || t('validation.name.length'),
                ]"
                hide-bottom-space
                outlined
                rounded
              >
                <template #before>
                  <q-icon name="title" />
                </template>
              </translated-input>

              <!-- Organizer -->
              <translated-input
                v-model="camp.organizer"
                :disable="loading"
                :label="t('field.organizer')"
                :locales="camp.countries"
                :rules="[
                  (val?: string) => !!val || t('validation.organizer.empty'),
                  (val: string) =>
                    val.length <= 255 || t('validation.organizer.length'),
                ]"
                hide-bottom-space
                outlined
                rounded
              >
                <template #before>
                  <q-icon name="corporate_fare" />
                </template>
              </translated-input>

              <!-- Contact email -->
              <translated-input
                v-model="camp.contactEmail"
                :disable="loading"
                :label="t('field.contactEmail')"
                :locales="camp.countries"
                :rules="[
                  (val?: string) => !!val || t('validation.contactEmail.empty'),
                ]"
                type="email"
                hide-bottom-space
                outlined
                rounded
              >
                <template #before>
                  <q-icon name="email" />
                </template>
              </translated-input>

              <!-- Location -->
              <translated-input
                v-model="camp.location"
                :disable="loading"
                :label="t('field.location')"
                :locales="camp.countries"
                :rules="[
                  (val?: string) => !!val || t('validation.location.empty'),
                  (val: string) =>
                    val.length < 255 || t('validation.location.length'),
                ]"
                hide-bottom-space
                outlined
                rounded
              >
                <template #before>
                  <q-icon name="map" />
                </template>
              </translated-input>
            </q-card-section>
          </q-card>

          <!-- Participants -->
          <q-card
            flat
            bordered
            class="section-card"
          >
            <q-card-section class="q-pb-none">
              <div class="row items-center no-wrap q-gutter-sm">
                <q-icon
                  name="groups"
                  color="primary"
                  size="20px"
                />
                <div class="text-subtitle2 text-weight-bold">
                  {{ t('section.participants') }}
                </div>
              </div>
            </q-card-section>

            <q-card-section class="column q-gutter-y-md">
              <!-- Max participants -->
              <translated-input
                v-model.number="camp.maxParticipants"
                :disable="loading"
                :label="t('field.maxParticipants')"
                :locales="camp.countries"
                :rules="[
                  (val?: number) =>
                    !!val || t('validation.maxParticipants.empty'),
                  (val: number) =>
                    val >= 0 || t('validation.maxParticipants.positive'),
                ]"
                always
                hide-bottom-space
                outlined
                rounded
                type="number"
              >
                <template #before>
                  <q-icon name="group" />
                </template>
              </translated-input>

              <!-- Age range -->
              <div class="row q-col-gutter-sm">
                <q-input
                  v-model.number="camp.minAge"
                  :disable="loading"
                  :label="t('field.minAge')"
                  :rules="[
                    (val?: number) => !!val || t('validation.minAge.empty'),
                    (val: number) => val > 0 || t('validation.minAge.positive'),
                    (val: number) => val < 100 || t('validation.minAge.max'),
                  ]"
                  class="col"
                  hide-bottom-space
                  outlined
                  rounded
                  type="number"
                >
                  <template #before>
                    <q-icon name="remove" />
                  </template>
                </q-input>

                <q-input
                  v-model.number="camp.maxAge"
                  :disable="loading"
                  :label="t('field.maxAge')"
                  :rules="[
                    (val?: number) => !!val || t('validation.maxAge.empty'),
                    (val: number) =>
                      (camp.minAge && val >= camp.minAge) ||
                      t('validation.maxAge.min'),
                    (val: number) => val < 100 || t('validation.minAge.max'),
                  ]"
                  class="col"
                  hide-bottom-space
                  outlined
                  rounded
                  type="number"
                >
                  <template #before>
                    <q-icon name="add" />
                  </template>
                </q-input>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Right column -->
        <div class="col-12 col-md-6 column q-gutter-y-md">
          <!-- Schedule -->
          <q-card
            flat
            bordered
            class="section-card"
          >
            <q-card-section class="q-pb-none">
              <div class="row items-center no-wrap q-gutter-sm">
                <q-icon
                  name="event"
                  color="primary"
                  size="20px"
                />
                <div class="text-subtitle2 text-weight-bold">
                  {{ t('section.schedule') }}
                </div>
              </div>
            </q-card-section>

            <q-card-section class="column q-gutter-y-md">
              <!-- Dates -->
              <date-range-input
                v-model:from="camp.startAt"
                v-model:to="camp.endAt"
                :disable="loading"
                :label="t('field.dateRange')"
                :rules="[
                  (val?: string) => !!val || t('validation.dateRange.empty'),
                ]"
                hide-bottom-space
                outlined
                rounded
              >
                <template #before>
                  <q-icon name="event" />
                </template>
              </date-range-input>

              <!-- Times -->
              <div class="row q-col-gutter-sm">
                <time-input
                  v-model="camp.startAt"
                  :disable="loading"
                  :label="t('field.startTime')"
                  :rules="[
                    (val?: string) => !!val || t('validation.startAt.empty'),
                  ]"
                  class="col"
                  hide-bottom-space
                  outlined
                  rounded
                >
                  <template #before>
                    <q-icon name="schedule" />
                  </template>
                </time-input>

                <time-input
                  v-model="camp.endAt"
                  :disable="loading"
                  :label="t('field.endTime')"
                  :rules="[
                    (val?: string) => !!val || t('validation.endAt.empty'),
                  ]"
                  class="col"
                  hide-bottom-space
                  outlined
                  rounded
                >
                  <template #before>
                    <q-icon name="schedule" />
                  </template>
                </time-input>
              </div>
            </q-card-section>
          </q-card>

          <!-- Registration -->
          <q-card
            flat
            bordered
            class="section-card"
          >
            <q-card-section class="q-pb-none">
              <div class="row items-center no-wrap q-gutter-sm">
                <q-icon
                  name="how_to_reg"
                  color="primary"
                  size="20px"
                />
                <div class="text-subtitle2 text-weight-bold">
                  {{ t('section.registration') }}
                </div>
              </div>
            </q-card-section>

            <q-card-section class="column q-gutter-y-md">
              <!-- Registration opens -->
              <date-time-input
                v-model="camp.registrationOpensAt"
                :disable="loading"
                :label="t('field.registrationOpensAt')"
                :rules="[
                  (val?: string | null) =>
                    !val ||
                    !camp.registrationClosesAt ||
                    val < camp.registrationClosesAt ||
                    t('validation.registrationOpensAt.before_close'),
                ]"
                clearable
                hide-bottom-space
                outlined
                rounded
              >
                <template #before>
                  <q-icon name="lock_open" />
                </template>
              </date-time-input>

              <!-- Registration closes -->
              <date-time-input
                v-model="camp.registrationClosesAt"
                :disable="loading"
                :label="t('field.registrationClosesAt')"
                :rules="[
                  (val?: string | null) =>
                    !val ||
                    !camp.registrationOpensAt ||
                    val > camp.registrationOpensAt ||
                    t('validation.registrationClosesAt.after_open'),
                ]"
                clearable
                hide-bottom-space
                outlined
                rounded
              >
                <template #before>
                  <q-icon name="lock" />
                </template>
              </date-time-input>

              <!-- Admission mode -->
              <q-select
                v-model="camp.confirmationMode"
                :label="t('field.confirmation_mode')"
                :options="confirmationModeOptions"
                map-options
                emit-value
                outlined
                rounded
              >
                <template #before>
                  <q-icon name="task_alt" />
                </template>
              </q-select>
            </q-card-section>
          </q-card>

          <!-- Pricing & visibility -->
          <q-card
            flat
            bordered
            class="section-card"
          >
            <q-card-section class="q-pb-none">
              <div class="row items-center no-wrap q-gutter-sm">
                <q-icon
                  name="sell"
                  color="primary"
                  size="20px"
                />
                <div class="text-subtitle2 text-weight-bold">
                  {{ t('section.pricing') }}
                </div>
              </div>
            </q-card-section>

            <q-card-section class="column q-gutter-y-md">
              <!-- Price -->
              <q-input
                v-model.number="camp.price"
                :disable="loading"
                :label="t('field.price')"
                :rules="[
                  (val?: number) =>
                    !!val || val === 0 || t('validation.price.empty'),
                  (val: number) => val >= 0 || t('validation.price.positive'),
                ]"
                hide-bottom-space
                input-class="text-right"
                outlined
                rounded
                suffix="€"
                type="number"
              >
                <template #before>
                  <q-icon name="euro" />
                </template>
              </q-input>

              <!-- Public -->
              <q-toggle
                v-model="camp.public"
                :label="t('field.public')"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Floating MD3 action toolbar -->
      <m-toolbar
        floating
        class="camp-actions"
      >
        <m-btn
          :label="t('action.reset')"
          :disable="loading"
          color="primary"
          text
          type="reset"
        />
        <m-btn
          :label="t('action.submit.edit')"
          :loading
          color="primary"
          type="submit"
        />
      </m-toolbar>
    </q-form>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import type { Camp, CampDetails } from '@camp-registration/common/entities';
import { useRoute, useRouter } from 'vue-router';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { storeToRefs } from 'pinia';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import TimeInput from 'components/common/inputs/TimeInput.vue';
import CountrySelect from 'components/common/CountrySelect.vue';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';
import DateRangeInput from 'components/common/inputs/DateRangeInput.vue';
import DateTimeInput from 'components/common/inputs/DateTimeInput.vue';
import { useI18n } from 'vue-i18n';
import type { QSelectOption } from 'quasar';
import { deepToRaw } from 'src/utils/deepToRaw';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const campStore = useCampDetailsStore();
const { data, error, isLoading } = storeToRefs(campStore);

const camp = ref<CampDetails>(initialValue());
const updating = ref<boolean>(false);

onMounted(async () => {
  await Promise.allSettled([campStore.fetchData()]);
});

const loading = computed(() => isLoading.value || updating.value);

// Only guard against navigation while the form holds unsaved edits.
// Compare against a freshly cloned baseline so the `public` default and key
// order match the working copy and don't register as spurious changes.
const preventLeave = computed<boolean>(() => {
  if (!data.value) {
    return false;
  }

  return JSON.stringify(camp.value) !== JSON.stringify(clone(data.value));
});

const confirmationModeOptions = computed<
  QSelectOption<CampDetails['confirmationMode']>[]
>(() => {
  return [
    {
      label: t('confirmation_mode.automatic'),
      value: 'AUTOMATIC',
    },
    {
      label: t('confirmation_mode.manual'),
      value: 'MANUAL',
    },
  ];
});

// Clone so edits never mutate the shared store state.
function clone(value: CampDetails): CampDetails {
  const cloned = structuredClone(deepToRaw(value));
  cloned.public = cloned.public ?? false;

  return cloned;
}

function initialValue(): CampDetails {
  return clone(data.value!);
}

function onReset() {
  camp.value = initialValue();
}

watch(data, (value) => {
  if (value) {
    camp.value = clone(value);
  }
});

async function onSubmit() {
  updating.value = true;
  const value: Camp | undefined = camp.value;

  if (value === undefined) {
    return;
  }

  const newCamp = await campStore.updateData(value);
  if (!newCamp) {
    updating.value = false;
    return;
  }

  return router.push({
    name: 'management.camp',
    params: { campId: route.params.campId },
  });
}
</script>

<style scoped>
.camp-edit {
  max-width: 1100px;
  /* Reserve space so the last card never hides behind the floating bar. */
  padding-bottom: 88px;
}

.section-card {
  border-radius: 16px;
}

/* Pin the toolbar to the bottom-centre of the viewport so it always floats
   above the content, regardless of form length. The pill/elevation styling
   comes from the `floating` prop. */
.camp-actions {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
}
</style>

<i18n lang="yaml" locale="en">
title:
  create: 'Create new camp'
  edit: 'Edit camp'

subtitle: 'Edit the general details of this camp.'

section:
  general: 'General'
  schedule: 'Schedule'
  registration: 'Registration'
  participants: 'Participants'
  pricing: 'Pricing & visibility'

field:
  countries: 'Countries'
  name: 'Camp name'
  organizer: 'Organizer'
  contactEmail: 'Contact email'
  maxParticipants: 'Maximum number of participants'
  dateRange: 'Start and end date'
  startTime: 'Start time'
  endTime: 'End time'
  registrationOpensAt: 'Registration opens (optional)'
  registrationClosesAt: 'Registration closes (optional)'
  minAge: 'Minimum age'
  maxAge: 'Maximum age'
  confirmation_mode: 'Accept registrations'
  location: 'Location'
  price: 'Price'
  public: 'Show camp on main page'

validation:
  countries:
    empty: 'Please select at least one countryQuestion'
  name:
    empty: 'Please enter a camp name'
    length: 'Camp name must not exceed 255 characters'
  organizer:
    empty: 'Please enter the organizer'
  contactEmail:
    empty: 'Please enter an email address'
  maxParticipants:
    empty: 'Please enter the maximum number of participants'
    positive: 'Maximum participants must be a positive number'
  dateRange:
    empty: 'Please select a start and end date'
  startAt:
    empty: 'Please select a start time'
  endAt:
    empty: 'Please select an end time'
  minAge:
    empty: 'Please enter a minimum age'
    positive: 'Minimum age must be a positive number'
    max: 'Minimum age must be less than 100'
  maxAge:
    empty: 'Please enter a maximum age'
    min: 'Maximum age must be greater than or equal to the minimum age'
    max: 'Maximum age must be less than 100'
  location:
    empty: 'Please enter a location'
    length: 'Location must not exceed 255 characters'
  price:
    empty: 'Please enter a price greater than or equal to 0'
    positive: 'Price must be a positive number'
  registrationOpensAt:
    before_close: 'Opening time must be before closing time'
  registrationClosesAt:
    after_open: 'Closing time must be after opening time'

confirmation_mode:
  automatic: 'Automatic'
  manual: 'Manual'

action:
  reset: 'Reset'
  submit:
    create: 'Create'
    edit: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title:
  create: 'Neues Camp erstellen'
  edit: 'Camp bearbeiten'

subtitle: 'Bearbeite die allgemeinen Angaben dieses Camps.'

section:
  general: 'Allgemein'
  schedule: 'Zeitraum'
  registration: 'Anmeldung'
  participants: 'Teilnehmende'
  pricing: 'Preis & Sichtbarkeit'

field:
  countries: 'Länder'
  name: 'Camp Name'
  organizer: 'Veranstalter'
  contactEmail: 'Kontakt-Email'
  maxParticipants: 'Maximale Teilnehmeranzahl'
  dateRange: 'Start- und Enddatum'
  startTime: 'Startzeit'
  endTime: 'Endzeit'
  registrationOpensAt: 'Anmeldung öffnet (optional)'
  registrationClosesAt: 'Anmeldung schließt (optional)'
  minAge: 'Mindestalter'
  maxAge: 'Maximalalter'
  confirmation_mode: 'Anmeldungen annehmen'
  location: 'Ort'
  price: 'Preis'
  public: 'Camp auf Startseite anzeigen'

validation:
  countries:
    empty: 'Bitte wählen Sie mindestens ein Land aus'
  name:
    empty: 'Bitte geben Sie einen Camp-Namen ein'
    length: 'Der Camp-Name darf maximal 255 Zeichen haben'
  organizer:
    empty: 'Bitte geben Sie ein Veranstalter an'
  contactEmail:
    empty: 'Bitte geben Sie eine Email Adresse an'
  maxParticipants:
    empty: 'Bitte geben Sie die maximale Teilnehmerzahl ein'
    positive: 'Die maximale Teilnehmerzahl muss eine positive Zahl sein'
  dateRange:
    empty: 'Bitte wählen Sie ein Start- und Enddatum aus'
  startAt:
    empty: 'Bitte wählen Sie eine Startzeit aus'
  endAt:
    empty: 'Bitte wählen Sie eine Endzeit aus'
  minAge:
    empty: 'Bitte geben Sie ein Mindestalter ein'
    positive: 'Das Mindestalter muss eine positive Zahl sein'
    max: 'Das Mindestalter muss kleiner als 100 sein'
  maxAge:
    empty: 'Bitte geben Sie ein Höchstalter ein'
    min: 'Das Höchstalter muss größer oder gleich dem Mindestalter sein'
    max: 'Das Höchstalter muss kleiner als 100 sein'
  location:
    empty: 'Bitte geben Sie einen Ort ein'
    length: 'Der Ort darf maximal 255 Zeichen haben'
  price:
    empty: 'Bitte geben Sie einen Preis größer oder gleich 0 ein'
    positive: 'Der Preis muss eine positive Zahl sein'
  registrationOpensAt:
    before_close: 'Der Öffnungszeitpunkt muss vor dem Schließzeitpunkt liegen'
  registrationClosesAt:
    after_open: 'Der Schließzeitpunkt muss nach dem Öffnungszeitpunkt liegen'

confirmation_mode:
  automatic: 'Automatisch'
  manual: 'Manuell'

action:
  reset: 'Reset'
  submit:
    create: 'Erstellen'
    edit: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  create: 'Créer un nouveau camp'
  edit: 'Modifier le camp'

subtitle: 'Modifiez les informations générales de ce camp.'

section:
  general: 'Général'
  schedule: 'Période'
  registration: 'Inscription'
  participants: 'Participants'
  pricing: 'Prix et visibilité'

field:
  countries: 'Pays'
  name: 'Nom du camp'
  organizer: 'Organisateur'
  contactEmail: 'Email de contact'
  maxParticipants: 'Nombre maximum de participants'
  dateRange: 'Date de début et de fin'
  startTime: 'Heure de début'
  endTime: 'Heure de fin'
  registrationOpensAt: 'Ouverture des inscriptions (optionnel)'
  registrationClosesAt: 'Clôture des inscriptions (optionnel)'
  minAge: 'Âge minimum'
  maxAge: 'Âge maximum'
  confirmation_mode: 'Accepter les inscriptions'
  location: 'Emplacement'
  price: 'Prix'
  public: "Afficher le camp sur la page d'accueil"

validation:
  countries:
    empty: 'Veuillez sélectionner au moins un pays'
  name:
    empty: 'Veuillez entrer un nom de camp'
    length: 'Le nom du camp ne doit pas dépasser 255 caractères'
  organizer:
    empty: "Veuillez entrer l'organisateur"
  contactEmail:
    empty: 'Veuillez entrer un email'
  maxParticipants:
    empty: 'Veuillez entrer le nombre maximum de participants'
    positive: 'Le nombre maximum de participants doit être un nombre positif'
  dateRange:
    empty: 'Veuillez sélectionner une date de début et de fin'
  startAt:
    empty: 'Veuillez sélectionner une heure de début'
  endAt:
    empty: 'Veuillez sélectionner une heure de fin'
  minAge:
    empty: 'Veuillez entrer un âge minimum'
    positive: "L'âge minimum doit être un nombre positif"
    max: "L'âge minimum doit être inférieur à 100"
  maxAge:
    empty: 'Veuillez entrer un âge maximum'
    min: "L'âge maximum doit être supérieur ou égal à l'âge minimum"
    max: "L'âge maximum doit être inférieur à 100"
  location:
    empty: 'Veuillez entrer un lieu'
    length: 'Le lieu ne doit pas dépasser 255 caractères'
  price:
    empty: 'Veuillez entrer un prix supérieur ou égal à 0'
    positive: 'Le prix doit être un nombre positif'
  registrationOpensAt:
    before_close: "L'heure d'ouverture doit être antérieure à l'heure de fermeture"
  registrationClosesAt:
    after_open: "L'heure de fermeture doit être postérieure à l'heure d'ouverture"

confirmation_mode:
  automatic: 'Automatique'
  manual: 'Manuel'

action:
  reset: 'Réinitialiser'
  submit:
    create: 'Créer'
    edit: 'Sauver'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  create: 'Utwórz nowy obóz'
  edit: 'Edytuj obóz'

subtitle: 'Edytuj ogólne dane tego obozu.'

section:
  general: 'Ogólne'
  schedule: 'Termin'
  registration: 'Rejestracja'
  participants: 'Uczestnicy'
  pricing: 'Cena i widoczność'

field:
  countries: 'Kraje'
  name: 'Nazwa obozu'
  organizer: 'Organizator'
  contactEmail: 'E-mail kontaktowy'
  maxParticipants: 'Maksymalna liczba uczestników'
  dateRange: 'Data rozpoczęcia i zakończenia'
  startTime: 'Czas rozpoczęcia'
  endTime: 'Czas zakończenia'
  registrationOpensAt: 'Rejestracja otwierana (opcjonalnie)'
  registrationClosesAt: 'Rejestracja zamykana (opcjonalnie)'
  minAge: 'Minimalny wiek'
  maxAge: 'Maksymalny wiek'
  confirmation_mode: 'Przyjmowanie zgłoszeń'
  location: 'Miejsce'
  price: 'Cena'
  public: 'Pokaż obóz na stronie głównej'

validation:
  countries:
    empty: 'Wybierz co najmniej jeden kraj'
  name:
    empty: 'Podaj nazwę obozu'
    length: 'Nazwa obozu może mieć maksymalnie 255 znaków'
  organizer:
    empty: 'Podaj organizatora'
  contactEmail:
    empty: 'Podaj adres e-mail'
  maxParticipants:
    empty: 'Podaj maksymalną liczbę uczestników'
    positive: 'Maksymalna liczba uczestników musi być liczbą dodatnią'
  dateRange:
    empty: 'Wybierz datę rozpoczęcia i zakończenia'
  startAt:
    empty: 'Wybierz godzinę rozpoczęcia'
  endAt:
    empty: 'Wybierz godzinę zakończenia'
  minAge:
    empty: 'Podaj minimalny wiek'
    positive: 'Minimalny wiek musi być liczbą dodatnią'
    max: 'Minimalny wiek musi być mniejszy niż 100'
  maxAge:
    empty: 'Podaj maksymalny wiek'
    min: 'Maksymalny wiek musi być większy lub równy minimalnemu'
    max: 'Maksymalny wiek musi być mniejszy niż 100'
  location:
    empty: 'Podaj lokalizację'
    length: 'Lokalizacja może mieć maksymalnie 255 znaków'
  price:
    empty: 'Podaj cenę większą lub równą 0'
    positive: 'Cena musi być liczbą dodatnią'
  registrationOpensAt:
    before_close: 'Czas otwarcia musi być wcześniejszy niż czas zamknięcia'
  registrationClosesAt:
    after_open: 'Czas zamknięcia musi być późniejszy niż czas otwarcia'

confirmation_mode:
  automatic: 'Automatyczny'
  manual: 'Ręczny'

action:
  reset: 'Resetuj'
  submit:
    create: 'Utwórz'
    edit: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  create: 'Vytvořit nový tábor'
  edit: 'Upravit tábor'

subtitle: 'Upravte obecné údaje tohoto tábora.'

section:
  general: 'Obecné'
  schedule: 'Termín'
  registration: 'Registrace'
  participants: 'Účastníci'
  pricing: 'Cena a viditelnost'

field:
  countries: 'Země'
  name: 'Název tábora'
  organizer: 'Organizátor'
  contactEmail: 'Kontaktní e-mail'
  maxParticipants: 'Maximální počet účastníků'
  dateRange: 'Datum začátku a konce'
  startTime: 'Čas začátku'
  endTime: 'Čas konce'
  registrationOpensAt: 'Otevření registrace (volitelné)'
  registrationClosesAt: 'Uzavření registrace (volitelné)'
  minAge: 'Minimální věk'
  maxAge: 'Maximální věk'
  confirmation_mode: 'Přijímání přihlášek'
  location: 'Místo'
  price: 'Cena'
  public: 'Zobrazit tábor na úvodní stránce'

validation:
  countries:
    empty: 'Vyberte alespoň jednu zemi'
  name:
    empty: 'Zadejte název tábora'
    length: 'Název tábora může mít maximálně 255 znaků'
  organizer:
    empty: 'Zadejte organizátora'
  contactEmail:
    empty: 'Zadejte e-mailovou adresu'
  maxParticipants:
    empty: 'Zadejte maximální počet účastníků'
    positive: 'Maximální počet účastníků musí být kladné číslo'
  dateRange:
    empty: 'Vyberte datum začátku a konce'
  startAt:
    empty: 'Vyberte čas začátku'
  endAt:
    empty: 'Vyberte čas konce'
  minAge:
    empty: 'Zadejte minimální věk'
    positive: 'Minimální věk musí být kladné číslo'
    max: 'Minimální věk musí být menší než 100'
  maxAge:
    empty: 'Zadejte maximální věk'
    min: 'Maximální věk musí být větší nebo roven minimálnímu'
    max: 'Maximální věk musí být menší než 100'
  location:
    empty: 'Zadejte místo'
    length: 'Místo může mít maximálně 255 znaků'
  price:
    empty: 'Zadejte cenu větší nebo rovnu 0'
    positive: 'Cena musí být kladné číslo'
  registrationOpensAt:
    before_close: 'Čas otevření musí být před časem zavření'
  registrationClosesAt:
    after_open: 'Čas zavření musí být po čase otevření'

confirmation_mode:
  automatic: 'Automatický'
  manual: 'Manuální'

action:
  reset: 'Resetovat'
  submit:
    create: 'Vytvořit'
    edit: 'Uložit'
</i18n>
