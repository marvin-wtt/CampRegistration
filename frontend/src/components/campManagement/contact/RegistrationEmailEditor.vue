<template>
  <email-editor
    v-model="model"
    :tokens
  />
</template>

<script setup lang="ts">
import type { CampDetails } from '@camp-registration/common/entities';
import { computed } from 'vue';
import { extractFormFields } from '@/utils/surveyJS';
import EmailEditor from '@/components/campManagement/contact/EmailEditor.vue';
import { useI18n } from 'vue-i18n';
import type {
  RegistrationComputedPath,
  RegistrationDataPath,
  TokenNode,
  TokenValue,
} from '@/components/campManagement/contact/TokenNode';

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

const tokens = computed<
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  TokenNode<RegistrationComputedPath | RegistrationDataPath>[]
>(() => {
  return [
    {
      value: 'camp',
      label: t('token.camp.label'),
      caption: t('token.camp.caption'),
      items: campTokens.map((value) => ({
        label: t(`token.camp.item.${value}.label`),
        caption: t(`token.camp.item.${value}.caption`),
        value,
      })),
    },
    {
      value: 'registration',
      label: t('token.registration.label'),
      caption: t('token.registration.caption'),
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
          value: 'computedData',
          label: t('token.registration.computed.label'),
          caption: t('token.registration.computed.caption'),
          items: [
            {
              label: t('token.registration.computed.entry.email.label'),
              caption: t('token.registration.computed.entry.email.caption'),
              value: 'emails.[0]',
            },
            {
              label: t('token.registration.computed.entry.firstName.label'),
              caption: t('token.registration.computed.entry.firstName.caption'),
              value: 'firstName',
            },
            {
              label: t('token.registration.computed.entry.lastName.label'),
              caption: t('token.registration.computed.entry.lastName.caption'),
              value: 'lastName',
            },
            {
              label: t('token.registration.computed.entry.role.label'),
              caption: t('token.registration.computed.entry.role.caption'),
              value: 'role',
            },
          ] satisfies TokenValue<RegistrationComputedPath>[],
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
    caption: 'General information about the camp'
    item:
      countries:
        label: 'Countries'
        caption: 'List of all participating countries'
      name:
        label: 'Name'
        caption: 'The name of the camp'
      organizer:
        label: 'Organizer'
        caption: 'The name of the organizer'
      contactEmail:
        label: 'Contact email'
        caption: 'The contact email address of the camp'
      maxParticipants:
        label: 'Maximum number of participants'
        caption: 'The maximum number of participants'
      startAt:
        label: 'Start time'
        caption: 'Start date and time of the camp'
      endAt:
        label: 'End time'
        caption: 'End date and time of the camp'
      minAge:
        label: 'Minimum age'
        caption: 'The minimum age of the participants'
      maxAge:
        label: 'Maximum age'
        caption: 'The maximum age of the participants'
      location:
        label: 'Location'
        caption: 'The location of the camp'
      price:
        label: 'Price'
        caption: 'The participation fee'
  registration:
    label: 'Registration'
    caption: 'Data submitted by the participant during registration'
    data:
      label: 'Form'
      caption: 'Direct access to registration form fields'
    computed:
      label: 'Computed'
      caption: 'Fields computed based on data tag'
      entry:
        email:
          label: 'Email'
          caption: 'The first email address of the registration'
        firstName:
          label: 'First Name'
          caption: 'The first name of the participant'
        lastName:
          label: 'Last Name'
          caption: 'The last name of the participant'
        role:
          label: 'Role'
          caption: 'The role of the participant'
</i18n>

<i18n lang="yaml" locale="de">
token:
  camp:
    label: 'Camp'
    caption: 'Allgemeine Informationen zum Camp'
    item:
      countries:
        label: 'Länder'
        caption: 'Liste aller teilnehmenden Länder'
      name:
        label: 'Name'
        caption: 'Der Name des Camps'
      organizer:
        label: 'Veranstalter'
        caption: 'Der Name des Veranstalters'
      contactEmail:
        label: 'Kontakt-E-Mail'
        caption: 'Die Kontakt-E-Mail-Adresse des Camps'
      maxParticipants:
        label: 'Maximale Teilnehmerzahl'
        caption: 'Die maximale Teilnehmerzahl'
      startAt:
        label: 'Startzeit'
        caption: 'Startdatum und -uhrzeit des Camps'
      endAt:
        label: 'Endzeit'
        caption: 'Enddatum und -uhrzeit des Camps'
      minAge:
        label: 'Mindestalter'
        caption: 'Das Mindestalter der Teilnehmer'
      maxAge:
        label: 'Höchstalter'
        caption: 'Das Höchstalter der Teilnehmer'
      location:
        label: 'Ort'
        caption: 'Der Ort des Camps'
      price:
        label: 'Preis'
        caption: 'Der Teilnahmebeitrag'
  registration:
    label: 'Anmeldung'
    caption: 'Daten aus der Anmeldung des Teilnehmers'
    data:
      label: 'Formular'
      caption: 'Direkter Zugriff auf die Felder des Anmeldeformulars'
    computed:
      label: 'Berechnet'
      caption: 'Felder, die basierend auf dem Daten-Tag berechnet werden'
      entry:
        email:
          label: 'E-Mail'
          caption: 'Die erste E-Mail-Adresse der Anmeldung'
        firstName:
          label: 'Vorname'
          caption: 'Der Vorname des Teilnehmers'
        lastName:
          label: 'Nachname'
          caption: 'Der Nachname des Teilnehmers'
        role:
          label: 'Rolle'
          caption: 'Die Rolle des Teilnehmers'
</i18n>

<i18n lang="yaml" locale="fr">
token:
  camp:
    label: 'Camp'
    caption: 'Informations générales sur le camp'
    item:
      countries:
        label: 'Pays'
        caption: 'Liste de tous les pays participants'
      name:
        label: 'Nom'
        caption: 'Le nom du camp'
      organizer:
        label: 'Organisateur'
        caption: "Le nom de l'organisateur"
      contactEmail:
        label: 'Email de contact'
        caption: "L'adresse email de contact du camp"
      maxParticipants:
        label: 'Nombre maximum de participants'
        caption: 'Le nombre maximum de participants'
      startAt:
        label: 'Heure de début'
        caption: 'Date et heure de début du camp'
      endAt:
        label: 'Heure de fin'
        caption: 'Date et heure de fin du camp'
      minAge:
        label: 'Âge minimum'
        caption: "L'âge minimum des participants"
      maxAge:
        label: 'Âge maximum'
        caption: "L'âge maximum des participants"
      location:
        label: 'Lieu'
        caption: 'Le lieu du camp'
      price:
        label: 'Prix'
        caption: 'Les frais de participation'
  registration:
    label: 'Inscription'
    caption: "Données issues de l'inscription du participant"
    data:
      label: 'Formulaire'
      caption: "Accès direct aux champs du formulaire d'inscription"
    computed:
      label: 'Calculé'
      caption: 'Champs calculés en fonction du tag de données'
      entry:
        email:
          label: 'Email'
          caption: "La première adresse email de l'inscription"
        firstName:
          label: 'Prénom'
          caption: 'Le prénom du participant'
        lastName:
          label: 'Nom de famille'
          caption: 'Le nom de famille du participant'
        role:
          label: 'Rôle'
          caption: 'Le rôle du participant'
</i18n>

<i18n lang="yaml" locale="pl">
token:
  camp:
    label: 'Obóz'
    caption: 'Ogólne informacje o obozie'
    item:
      countries:
        label: 'Kraje'
        caption: 'Lista wszystkich uczestniczących krajów'
      name:
        label: 'Nazwa'
        caption: 'Nazwa obozu'
      organizer:
        label: 'Organizator'
        caption: 'Nazwa organizatora'
      contactEmail:
        label: 'E-mail kontaktowy'
        caption: 'Kontaktowy adres e-mail obozu'
      maxParticipants:
        label: 'Maksymalna liczba uczestników'
        caption: 'Maksymalna liczba uczestników'
      startAt:
        label: 'Czas rozpoczęcia'
        caption: 'Data i godzina rozpoczęcia obozu'
      endAt:
        label: 'Czas zakończenia'
        caption: 'Data i godzina zakończenia obozu'
      minAge:
        label: 'Minimalny wiek'
        caption: 'Minimalny wiek uczestników'
      maxAge:
        label: 'Maksymalny wiek'
        caption: 'Maksymalny wiek uczestników'
      location:
        label: 'Miejsce'
        caption: 'Miejsce obozu'
      price:
        label: 'Cena'
        caption: 'Opłata za uczestnictwo'
  registration:
    label: 'Rejestracja'
    caption: 'Dane z rejestracji uczestnika'
    data:
      label: 'Formularz'
      caption: 'Bezpośredni dostęp do pól formularza rejestracyjnego'
    computed:
      label: 'Obliczone'
      caption: 'Pola obliczane na podstawie danych zgłoszenia'
      entry:
        email:
          label: 'E-mail'
          caption: 'Pierwszy adres e-mail zgłoszenia'
        firstName:
          label: 'Imię'
          caption: 'Imię uczestnika'
        lastName:
          label: 'Nazwisko'
          caption: 'Nazwisko uczestnika'
        role:
          label: 'Rola'
          caption: 'Rola uczestnika'
</i18n>

<i18n lang="yaml" locale="cs">
token:
  camp:
    label: 'Tábor'
    caption: 'Obecné informace o táboře'
    item:
      countries:
        label: 'Země'
        caption: 'Seznam všech zúčastněných zemí'
      name:
        label: 'Název'
        caption: 'Název tábora'
      organizer:
        label: 'Organizátor'
        caption: 'Název organizátora'
      contactEmail:
        label: 'Kontaktní e-mail'
        caption: 'Kontaktní e-mailová adresa tábora'
      maxParticipants:
        label: 'Maximální počet účastníků'
        caption: 'Maximální počet účastníků'
      startAt:
        label: 'Čas začátku'
        caption: 'Datum a čas začátku tábora'
      endAt:
        label: 'Čas konce'
        caption: 'Datum a čas konce tábora'
      minAge:
        label: 'Minimální věk'
        caption: 'Minimální věk účastníků'
      maxAge:
        label: 'Maximální věk'
        caption: 'Maximální věk účastníků'
      location:
        label: 'Místo'
        caption: 'Místo konání tábora'
      price:
        label: 'Cena'
        caption: 'Účastnický poplatek'
  registration:
    label: 'Registrace'
    caption: 'Údaje z registrace účastníka'
    data:
      label: 'Formulář'
      caption: 'Přímý přístup k polím registračního formuláře'
    computed:
      label: 'Vypočtené'
      caption: 'Pole vypočítaná na základě dat registrace'
      entry:
        email:
          label: 'E-mail'
          caption: 'První e-mailová adresa registrace'
        firstName:
          label: 'Jméno'
          caption: 'Jméno účastníka'
        lastName:
          label: 'Příjmení'
          caption: 'Příjmení účastníka'
        role:
          label: 'Role'
          caption: 'Role účastníka'
</i18n>
