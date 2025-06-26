<template>
  <q-form
    class="q-gutter-y-md column q-pa-md"
    greedy
    style="width: 400px"
    @reset="onReset"
    @submit="onSubmit"
  >
    <a class="text-h4">
      {{ title }}
    </a>

    <!-- Countries -->
    <country-select
      v-model="data.countries"
      :disable="loading"
      :label="t('field.countries')"
      :countries="['de', 'fr', 'pl']"
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

    <!-- name -->
    <translated-input
      v-model="data.name"
      :disable="loading"
      :label="t('field.name')"
      :locales="data.countries"
      :rules="[
        (val?: string) => !!val || t('validation.name.empty'),
        (val: string) => val.length <= 255 || t('validation.name.length'),
      ]"
      hide-bottom-space
      outlined
      rounded
    >
      <template #before>
        <q-icon name="title" />
      </template>
    </translated-input>

    <!-- organizer -->
    <translated-input
      v-model="data.organizer"
      :disable="loading"
      :label="t('field.organizer')"
      :locales="data.countries"
      :rules="[
        (val?: string) => !!val || t('validation.organizer.empty'),
        (val: string) => val.length <= 255 || t('validation.organizer.length'),
      ]"
      hide-bottom-space
      outlined
      rounded
    >
      <template #before>
        <q-icon name="corporate_fare" />
      </template>
    </translated-input>

    <!-- contact email -->
    <translated-input
      v-model="data.contactEmail"
      :disable="loading"
      :label="t('field.contactEmail')"
      :locales="data.countries"
      :rules="[(val?: string) => !!val || t('validation.contactEmail.empty')]"
      type="email"
      hide-bottom-space
      outlined
      rounded
    >
      <template #before>
        <q-icon name="email" />
      </template>
    </translated-input>

    <!-- dates -->
    <date-range-input
      v-model:from="data.startAt"
      v-model:to="data.endAt"
      :disable="loading"
      :label="t('field.dateRange')"
      :rules="[(val?: string) => !!val || t('validation.dateRange.empty')]"
      hide-bottom-space
      outlined
      rounded
    >
      <template #before>
        <q-icon name="event" />
      </template>
    </date-range-input>

    <!-- Times -->
    <div class="row">
      <time-input
        v-model="data.startAt"
        :disable="loading"
        :label="t('field.startTime')"
        :rules="[(val?: string) => !!val || t('validation.startAt.empty')]"
        class="col-xs-12 col-sm-6 col-md-6 col-lg-6 col-xl-6"
        hide-bottom-space
        outlined
        rounded
      >
        <template #before>
          <q-icon name="schedule" />
        </template>
      </time-input>

      <time-input
        v-model="data.endAt"
        :disable="loading"
        :label="t('field.endTime')"
        :rules="[(val?: string) => !!val || t('validation.endAt.empty')]"
        class="col-xs-12 col-sm-6 col-md-6 col-lg-6 col-xl-6"
        hide-bottom-space
        outlined
        rounded
      >
        <template #before>
          <!-- Invalid name for spacing -->
          <q-icon name="none" />
        </template>
      </time-input>
    </div>

    <!-- participants -->
    <translated-input
      v-model.number="data.maxParticipants"
      :disable="loading"
      :label="t('field.maxParticipants')"
      :locales="data.countries"
      :rules="[
        (val?: number) => !!val || t('validation.maxParticipants.empty'),
        (val: number) => val >= 0 || t('validation.maxParticipants.positive'),
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

    <!-- age -->
    <!-- minAge -->
    <q-input
      v-model.number="data.minAge"
      :disable="loading"
      :label="t('field.minAge')"
      :rules="[
        (val?: number) => !!val || t('validation.minAge.empty'),
        (val: number) => val > 0 || t('validation.minAge.positive'),
        (val: number) => val < 100 || t('validation.minAge.max'),
      ]"
      hide-bottom-space
      outlined
      rounded
      type="number"
    >
      <template #before>
        <q-icon name="remove" />
      </template>
    </q-input>

    <!-- maxAge -->
    <q-input
      v-model.number="data.maxAge"
      :disable="loading"
      :label="t('field.maxAge')"
      :rules="[
        (val?: number) => !!val || t('validation.maxAge.empty'),
        (val: number) =>
          (data.minAge && val >= data.minAge) || t('validation.maxAge.min'),
        (val: number) => val < 100 || t('validation.minAge.max'),
      ]"
      hide-bottom-space
      outlined
      rounded
      type="number"
    >
      <template #before>
        <q-icon name="add" />
      </template>
    </q-input>

    <!-- location -->
    <translated-input
      v-model="data.location"
      :disable="loading"
      :label="t('field.location')"
      :locales="data.countries"
      :rules="[
        (val?: string) => !!val || t('validation.location.empty'),
        (val: string) => val.length < 255 || t('validation.location.length'),
      ]"
      hide-bottom-space
      outlined
      rounded
    >
      <template #before>
        <q-icon name="map" />
      </template>
    </translated-input>

    <!-- price -->
    <q-input
      v-model.number="data.price"
      :disable="loading"
      :label="t('field.price')"
      :rules="[
        (val?: number) => !!val || val === 0 || t('validation.price.empty'),
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
      v-model="data.public"
      :label="t('field.public')"
    />

    <!-- action -->
    <div class="row justify-end">
      <q-btn
        v-if="props.mode === 'edit'"
        :disable="loading"
        :label="t('action.reset')"
        class="q-ml-sm"
        color="primary"
        flat
        rounded
        type="reset"
      />
      <q-btn
        :label="submitLabel"
        :loading="loading"
        color="primary"
        rounded
        type="submit"
      />
    </div>
  </q-form>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { Camp } from '@camp-registration/common/entities';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';
import { useI18n } from 'vue-i18n';
import CountrySelect from 'components/common/CountrySelect.vue';
import TimeInput from 'components/common/inputs/TimeInput.vue';
import DateRangeInput from 'components/common/inputs/DateRangeInput.vue';
import { deepToRaw } from 'src/utils/deepToRaw';

const { t } = useI18n();

interface Props {
  mode: 'create' | 'edit';
  modelValue: Partial<Camp>;
  loading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Partial<Camp>): void;
  (e: 'submit'): void;
}>();

const loading = computed<boolean>(() => {
  return props.loading ?? false;
});

const data = ref<Partial<Camp>>(initialValue());

const title = computed<string>(() => {
  return props.mode === 'create' ? t('title.create') : t('title.edit');
});

const submitLabel = computed<string>(() => {
  return props.mode === 'create'
    ? t('action.submit.create')
    : t('action.submit.edit');
});

function initialValue(): Partial<Camp> {
  const camp = structuredClone(deepToRaw(props.modelValue));
  camp.public = camp.public ?? false;
  return camp;
}

function onSubmit() {
  emit('update:modelValue', data.value);
  emit('submit');
}

function onReset() {
  data.value = initialValue();
}
</script>

<i18n lang="yaml" locale="en">
title:
  create: 'Create new camp'
  edit: 'Edit camp'

field:
  countries: 'Countries'
  name: 'Camp name'
  organizer: 'Organizer'
  contactEmail: 'Contact email'
  maxParticipants: 'Maximum number of participants'
  dateRange: 'Start and end date'
  startTime: 'Start time'
  endTime: 'End time'
  minAge: 'Minimum age'
  maxAge: 'Maximum age'
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

field:
  countries: 'Länder'
  name: 'Camp Name'
  organizer: 'Veranstalter'
  contactEmail: 'Kontakt-Email'
  maxParticipants: 'Maximale Teilnehmeranzahl'
  dateRange: 'Start- und Enddatum'
  startTime: 'Startzeit'
  endTime: 'Endzeit'
  minAge: 'Mindestalter'
  maxAge: 'Maximalalter'
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

field:
  countries: 'Pays'
  name: 'Nom du camp'
  organizer: 'Organisateur'
  contactEmail: 'Email de contact'
  maxParticipants: 'Nombre maximum de participants'
  dateRange: 'Date de début et de fin'
  startTime: 'Heure de début'
  endTime: 'Heure de fin'
  minAge: 'Âge minimum'
  maxAge: 'Âge maximum'
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

action:
  reset: 'Réinitialiser'
  submit:
    create: 'Créer'
    edit: 'Sauver'
</i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
