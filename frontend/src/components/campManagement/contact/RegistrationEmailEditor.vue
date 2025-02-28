<template>
  <email-editor
    v-model="model"
    :tokens
  />
</template>

<script setup lang="ts">
import type { CampDetails } from '@camp-registration/common/entities';
import { computed } from 'vue';
import type { Token } from 'components/campManagement/contact/Token';
import { extractFormFields } from 'src/utils/surveyJS';
import EmailEditor from 'components/campManagement/contact/EmailEditor.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const model = defineModel<string>({
  required: true,
});

const { form } = defineProps<{
  form: CampDetails['form'] | undefined;
}>();

const campTokens: (keyof CampDetails)[] = [
  'name',
  'organizer',
  'countries',
  'contactEmail',
  'startAt',
  'endAt',
  'minAge',
  'maxAge',
  'maxParticipants',
  'location',
];

const tokens = computed<Token[]>(() => {
  return [
    {
      key: 'camp',
      label: t('token.camp.label'),
      items: campTokens.map((value) => ({
        label: t(`token.camp.item.${value}`),
        value,
      })),
    },
    {
      key: 'registration',
      label: t('token.registration.label'),
      items: !form ? [] : extractFormFields(form, 'data'),
    },
  ];
});
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
token:
  camp:
    label: 'Camp'
    item:
      countries: 'Countries'
      name: 'Name'
      organizer: 'Organizer'
      contactEmail: 'Contact email'
      maxParticipants: 'Maximum number of participants'
      startAt: 'Start time'
      endAt: 'End time'
      minAge: 'Minimum age'
      maxAge: 'Maximum age'
      location: 'Location'
      price: 'Price'
  registration:
    label: 'Registration'
</i18n>

<i18n lang="yaml" locale="de">
token:
  camp:
    label: 'Camp'
    item:
      countries: 'Länder'
      name: 'Name'
      organizer: 'Veranstalter'
      contactEmail: 'Kontakt-E-Mail'
      maxParticipants: 'Maximale Teilnehmerzahl'
      startAt: 'Startzeit'
      endAt: 'Endzeit'
      minAge: 'Mindestalter'
      maxAge: 'Höchstalter'
      location: 'Ort'
      price: 'Preis'
  registration:
    label: 'Anmeldung'
</i18n>

<i18n lang="yaml" locale="fr">
token:
  camp:
    label: 'Camp'
    item:
      countries: 'Pays'
      name: 'Nom'
      organizer: 'Organisateur'
      contactEmail: 'E-mail de contact'
      maxParticipants: 'Nombre maximum de participants'
      startAt: 'Heure de début'
      endAt: 'Heure de fin'
      minAge: 'Âge minimum'
      maxAge: 'Âge maximum'
      location: 'Lieu'
      price: 'Prix'
  registration:
    label: 'Inscription'
</i18n>
