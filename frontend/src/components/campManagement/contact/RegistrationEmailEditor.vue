<template>
  <email-editor
    v-model="model"
    :tokens
  />
</template>

<script setup lang="ts">
import type { CampDetails } from '@camp-registration/common/entities';
import { computed } from 'vue';
import type { TokenRegistry } from 'components/campManagement/contact/TokenRegistry';
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

const tokens = computed<TokenRegistry[]>(() => {
  return [
    {
      value: 'camp',
      label: t('token.camp.label'),
      items: campTokens.map((value) => ({
        label: t(`token.camp.item.${value}`),
        value,
      })),
    },
    {
      value: 'registration',
      label: t('token.registration.label'),
      items: [
        {
          value: 'data',
          label: t('token.registration.data.label'),
          caption: t('token.registration.data.caption'),
          items: form
            ? extractFormFields(form).map((field) => ({
                ...field,
                value: replaceWildcard(field.value),
              }))
            : [],
        },
        {
          value: 'campData',
          label: t('token.registration.computed.label'),
          caption: t('token.registration.computed.caption'),
          items: [
            {
              label: t('token.registration.computed.entry.email'),
              value: 'email.[0]',
            },
            {
              label: t('token.registration.computed.entry.firstName'),
              value: 'first_name.[0]',
            },
            {
              label: t('token.registration.computed.entry.lastName'),
              value: 'last_name.[0]',
            },
            {
              label: t('token.registration.computed.entry.role'),
              value: 'role.[0]',
            },
          ],
        },
      ],
    },
  ];
});

const WILDCARD_REGEX = /(\.)\*(\.|$)/g;
function replaceWildcard(v: string): string {
  return v.replace(WILDCARD_REGEX, '$1[0]$2');
}
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
    data:
      label: 'Form'
      caption: 'Direct access to registration form fields'
    computed:
      label: 'Computed'
      caption: 'Fields computed based on data tag'
      entry:
        email: 'Email'
        firstName: 'First Name'
        lastName: 'Last Name'
        role: 'Role'
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
    data:
      label: 'Formular'
      caption: 'Direkter Zugriff auf die Felder des Anmeldeformulars'
    computed:
      label: 'Berechnet'
      caption: 'Felder, die basierend auf dem Daten-Tag berechnet werden'
      entry:
        email: 'E-Mail'
        firstName: 'Vorname'
        lastName: 'Nachname'
        role: 'Rolle'
</i18n>

<i18n lang="yaml" locale="fr">
token:
  camp:
    label: 'Camp'
    item:
      countries: 'Pays'
      name: 'Nom'
      organizer: 'Organisateur'
      contactEmail: 'Email de contact'
      maxParticipants: 'Nombre maximum de participants'
      startAt: 'Heure de début'
      endAt: 'Heure de fin'
      minAge: 'Âge minimum'
      maxAge: 'Âge maximum'
      location: 'Lieu'
      price: 'Prix'
  registration:
    label: 'Inscription'
    data:
      label: 'Formulaire'
      caption: "Accès direct aux champs du formulaire d'inscription"
    computed:
      label: 'Calculé'
      caption: 'Champs calculés en fonction du tag de données'
      entry:
        email: 'Email'
        firstName: 'Prénom'
        lastName: 'Nom de famille'
        role: 'Rôle'
</i18n>
