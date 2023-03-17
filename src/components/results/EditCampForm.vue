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
    <q-select
      v-model="data.countries"
      :disable="loading"
      :label="t('field.countries')"
      :options="['de', 'fr', 'pl']"
      :rules="[
        (val) => (val && val.length > 0) || t('validation.countries.empty'),
      ]"
      hide-bottom-space
      multiple
      outlined
      rounded
    >
      <template v-slot:before>
        <q-icon name="language" />
      </template>
    </q-select>

    <!-- name -->
    <translated-input
      v-model="data.name"
      :disable="loading"
      :label="t('field.name')"
      :locales="data.countries"
      :rules="[(val) => !!val || t('validation.name.empty')]"
      hide-bottom-space
      outlined
      rounded
    >
      <template v-slot:before>
        <q-icon name="title" />
      </template>
    </translated-input>

    <!-- participants -->
    <translated-input
      v-model.number="data.maxParticipants"
      :disable="loading"
      :label="t('field.maxParticipants')"
      :locales="data.countries"
      :rules="[(val) => !!val || t('validation.maxParticipants.empty')]"
      always
      hide-bottom-space
      outlined
      rounded
      type="number"
    >
      <template v-slot:before>
        <q-icon name="group" />
      </template>
    </translated-input>

    <!-- dates -->
    <!-- startDate -->
    <date-input
      v-model="data.startDate"
      :disable="loading"
      :label="t('field.startDate')"
      :rules="[(val) => !!val || t('validation.startDate.empty')]"
      hide-bottom-space
      outlined
      rounded
    >
      <template v-slot:before>
        <q-icon name="event" />
      </template>
    </date-input>

    <!-- endDate -->
    <date-input
      v-model="data.endDate"
      :disable="loading"
      :label="t('field.endDate')"
      :rules="[
        (val) => !!val || t('validation.endDate.empty'),
        (val) => val >= data.startDate || t('validation.endDate.later'),
      ]"
      hide-bottom-space
      outlined
      rounded
    >
      <template v-slot:before>
        <q-icon name="event" />
      </template>
    </date-input>

    <!-- age -->
    <!-- minAge -->
    <q-input
      v-model.number="data.minAge"
      :disable="loading"
      :label="t('field.minAge')"
      :rules="[(val) => val > 0 || t('validation.maxAge')]"
      hide-bottom-space
      outlined
      rounded
      type="number"
    >
      <template v-slot:before>
        <q-icon name="remove" />
      </template>
    </q-input>

    <!-- maxAge -->
    <q-input
      v-model.number="data.maxAge"
      :disable="loading"
      :label="t('field.maxAge')"
      :rules="[(val) => val >= data.minAge || t('validation.maxAge')]"
      hide-bottom-space
      outlined
      rounded
      type="number"
    >
      <template v-slot:before>
        <q-icon name="add" />
      </template>
    </q-input>

    <!-- location -->
    <translated-input
      v-model="data.location"
      :disable="loading"
      :label="t('field.location')"
      :locales="data.countries"
      :rules="[(val) => !!val || t('validation.location.empty')]"
      hide-bottom-space
      outlined
      rounded
    >
      <template v-slot:before>
        <q-icon name="map" />
      </template>
    </translated-input>

    <!-- price -->
    <q-input
      v-model.number="data.price"
      :disable="loading"
      :label="t('field.price')"
      :rules="[(val) => val > 0 || t('validation.price.empty')]"
      hide-bottom-space
      input-class="text-right"
      outlined
      rounded
      suffix="€"
      type="number"
    >
      <template v-slot:before>
        <q-icon name="euro" />
      </template>
    </q-input>

    <!-- form -->
    <!-- TODO Edit form -->

    <!-- action -->
    <div class="row justify-end">
      <q-btn
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
import { computed, ref, toRaw } from 'vue';
import { Camp } from 'src/types/Camp';

import TranslatedInput from 'components/TranslatedInput.vue';
import DateInput from 'components/DateInput.vue';
import { useI18n } from 'vue-i18n';

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

const data = ref<Partial<Camp>>(structuredClone(toRaw(props.modelValue)));

const title = computed<string>(() => {
  return props.mode === 'create' ? t('title.create') : t('title.edit');
});

const submitLabel = computed<string>(() => {
  return props.mode === 'create'
    ? t('action.submit.create')
    : t('action.submit.edit');
});

function onSubmit() {
  emit('update:modelValue', data.value);
  emit('submit');
}

function onReset() {
  data.value = structuredClone(toRaw(props.modelValue));
}
</script>

<i18n lang="yaml" locale="en">
title:
  create: 'Create new camp'
  edit: 'Edit camp'

field:
  countries: 'Countries'
  name: 'Camp name'
  maxParticipants: 'Maximum amount of participants'
  startDate: 'Start date'
  endDate: 'End date'
  minAge: 'Minimum age'
  maxAge: 'Maximum age'
  location: 'Location'
  price: 'Price'

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
  maxParticipants: 'Maximale Anzahl von Teilnehmenden'
  startDate: 'Startdatum'
  endDate: 'Enddatum'
  minAge: 'Mindestalter'
  maxAge: 'Maximalalter'
  location: 'Ort'
  price: 'Preis'

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
  maxParticipants: 'Nombre maximum de participants'
  startDate: 'Date de début'
  endDate: 'Date de fin'
  minAge: 'Âge minimum'
  maxAge: 'Âge maximum'
  location: 'Emplacement'
  price: 'Prix'

action:
  reset: 'Réinitialiser'
  submit:
    create: 'Créer'
    edit: 'Sauver'
</i18n>

<!-- TODO -->
<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
