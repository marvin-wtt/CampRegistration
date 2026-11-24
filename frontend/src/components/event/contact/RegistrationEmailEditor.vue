<template>
  <email-editor
    v-model="model"
    :tokens
    :single-line
    :plain-text
    :placeholder
  />
</template>

<script setup lang="ts">
import type {
  EventDetails,
  RegistrationMessagePath,
} from '@camp-registration/common/entities';
import { computed } from 'vue';
import { extractFormFields } from '@camp-registration/common/form';
import EmailEditor from '@/components/event/contact/EmailEditor.vue';
import { useI18n } from 'vue-i18n';
import type {
  Token,
  TokenItem,
} from '@/components/event/contact/TokenRegistry';

const { t } = useI18n();

const model = defineModel<string>({
  required: true,
});

const { form, trigger, singleLine, plainText, placeholder } = defineProps<{
  form: EventDetails['form'] | undefined;
  trigger?: string | undefined;
  singleLine?: boolean;
  plainText?: boolean;
  placeholder?: string;
}>();

type Path = RegistrationMessagePath;

// Keys under `token.<group>.<key>` name each token's label and caption.
function token(group: string, key: string, value: Path): Token<Path> {
  return {
    label: t(`token.${group}.${key}.label`),
    caption: t(`token.${group}.${key}.caption`),
    value,
  };
}

function group(key: string, items: TokenItem<Path>[]): TokenItem<Path> {
  return {
    label: t(`token.${key}.label`),
    caption: t(`token.${key}.caption`),
    items,
  };
}

const tokens = computed<TokenItem<Path>[]>(() => [
  group('registration', [
    group('participant', [
      token('participant', 'firstName', 'registration.computedData.firstName'),
      token('participant', 'lastName', 'registration.computedData.lastName'),
      token('participant', 'email', 'registration.computedData.emails.[0]'),
      token(
        'participant',
        'phone',
        'registration.computedData.phoneNumbers.[0]',
      ),
      token(
        'participant',
        'dateOfBirth',
        'registration.computedData.dateOfBirth',
      ),
      token('participant', 'role', 'registration.computedData.role'),
      group('address', [
        token('address', 'street', 'registration.computedData.address.street'),
        token(
          'address',
          'zipCode',
          'registration.computedData.address.zipCode',
        ),
        token('address', 'city', 'registration.computedData.address.city'),
        token(
          'address',
          'country',
          'registration.computedData.address.country',
        ),
      ]),
    ]),
    group(
      'form',
      form
        ? // Special-category answers never reach a mail, so aren't offered.
          extractFormFields(form, undefined, {
            withoutSpecialCategories: true,
          }).map(({ label, value }) => ({
            label,
            caption: value,
            value: `registration.data.${replaceWildcard(value)}`,
          }))
        : [],
    ),
    ...(trigger === 'registration_updated'
      ? [token('registration', 'changes', 'registration.changes')]
      : []),
    group('payment', [
      token('payment', 'price', 'registration.priceWithCurrency'),
      token('payment', 'reference', 'registration.reference'),
    ]),
    token('registration', 'group', 'registration.group'),
    token('registration', 'createdAt', 'registration.createdAt'),
  ]),
  group('event', [
    token('event', 'name', 'event.name'),
    token('event', 'organizer', 'event.organizer'),
    token('event', 'contactEmail', 'event.contactEmail'),
    token('event', 'startAt', 'event.startAt'),
    token('event', 'endAt', 'event.endAt'),
    token('event', 'location', 'event.location'),
    token('event', 'countries', 'event.countries'),
    token('event', 'minAge', 'event.minAge'),
    token('event', 'maxAge', 'event.maxAge'),
    token('event', 'maxParticipants', 'event.maxParticipants'),
  ]),
]);

const WILDCARD_REGEX = /(\.)\*(\.|$)/g;
function replaceWildcard(v: string): string {
  return v.replace(WILDCARD_REGEX, '$1[0]$2');
}
</script>

<i18n lang="yaml" locale="en">
token:
  registration:
    label: 'Registration'
    caption: 'Data submitted by the participant during registration'
    changes:
      label: 'Changes'
      caption: 'The fields this edit changed, with their new values'
    group:
      label: 'Group'
      caption: 'The country of the group registered for'
    createdAt:
      label: 'Registered on'
      caption: 'Date and time of the registration'
  participant:
    label: 'Participant'
    caption: 'Name, contact and role, whichever form fields hold them'
    firstName:
      label: 'First name'
      caption: 'The first name of the participant'
    lastName:
      label: 'Last name'
      caption: 'The last name of the participant'
    email:
      label: 'Email'
      caption: 'The first email address of the registration'
    phone:
      label: 'Phone number'
      caption: 'The first phone number of the registration'
    dateOfBirth:
      label: 'Date of birth'
      caption: 'The date of birth of the participant'
    role:
      label: 'Role'
      caption: 'The role of the participant'
  address:
    label: 'Address'
    caption: 'The postal address of the participant'
    street:
      label: 'Street'
      caption: 'Street and house number'
    zipCode:
      label: 'Postal code'
      caption: 'The postal code'
    city:
      label: 'City'
      caption: 'The city'
    country:
      label: 'Country'
      caption: 'The country, by name'
  form:
    label: 'Registration form'
    caption: 'The answer to any field of the registration form'
  payment:
    label: 'Payment'
    caption: 'Price and bank transfer reference'
    price:
      label: 'Price'
      caption: 'What this registration costs, with currency'
    reference:
      label: 'Transfer reference'
      caption: 'For the description of a bank transfer, e.g. K7MX-0042'
  event:
    label: 'Event'
    caption: 'General information about the event'
    name:
      label: 'Name'
      caption: 'The name of the event'
    organizer:
      label: 'Organizer'
      caption: 'The name of the organizer'
    contactEmail:
      label: 'Contact email'
      caption: 'The contact email address of the event'
    startAt:
      label: 'Start time'
      caption: 'Start date and time of the event'
    endAt:
      label: 'End time'
      caption: 'End date and time of the event'
    location:
      label: 'Location'
      caption: 'The location of the event'
    countries:
      label: 'Countries'
      caption: 'List of all participating countries'
    minAge:
      label: 'Minimum age'
      caption: 'The minimum age of the participants'
    maxAge:
      label: 'Maximum age'
      caption: 'The maximum age of the participants'
    maxParticipants:
      label: 'Maximum number of participants'
      caption: 'The maximum number of participants'
</i18n>

<i18n lang="yaml" locale="de">
token:
  registration:
    label: 'Anmeldung'
    caption: 'Daten aus der Anmeldung des Teilnehmers'
    changes:
      label: 'Änderungen'
      caption: 'Die geänderten Felder mit ihren neuen Werten'
    group:
      label: 'Gruppe'
      caption: 'Das Land der angemeldeten Gruppe'
    createdAt:
      label: 'Angemeldet am'
      caption: 'Datum und Uhrzeit der Anmeldung'
  participant:
    label: 'Teilnehmer'
    caption: 'Name, Kontakt und Rolle, egal in welchem Formularfeld sie stehen'
    firstName:
      label: 'Vorname'
      caption: 'Der Vorname des Teilnehmers'
    lastName:
      label: 'Nachname'
      caption: 'Der Nachname des Teilnehmers'
    email:
      label: 'E-Mail'
      caption: 'Die erste E-Mail-Adresse der Anmeldung'
    phone:
      label: 'Telefonnummer'
      caption: 'Die erste Telefonnummer der Anmeldung'
    dateOfBirth:
      label: 'Geburtsdatum'
      caption: 'Das Geburtsdatum des Teilnehmers'
    role:
      label: 'Rolle'
      caption: 'Die Rolle des Teilnehmers'
  address:
    label: 'Adresse'
    caption: 'Die Postanschrift des Teilnehmers'
    street:
      label: 'Straße'
      caption: 'Straße und Hausnummer'
    zipCode:
      label: 'Postleitzahl'
      caption: 'Die Postleitzahl'
    city:
      label: 'Ort'
      caption: 'Der Wohnort'
    country:
      label: 'Land'
      caption: 'Das Land, mit Namen'
  form:
    label: 'Anmeldeformular'
    caption: 'Die Antwort auf ein beliebiges Feld des Anmeldeformulars'
  payment:
    label: 'Zahlung'
    caption: 'Preis und Verwendungszweck der Überweisung'
    price:
      label: 'Preis'
      caption: 'Was diese Anmeldung kostet, mit Währung'
    reference:
      label: 'Verwendungszweck'
      caption: 'Für die Überweisung, z. B. K7MX-0042'
  event:
    label: 'Veranstaltung'
    caption: 'Allgemeine Informationen zur Veranstaltung'
    name:
      label: 'Name'
      caption: 'Der Name der Veranstaltung'
    organizer:
      label: 'Veranstalter'
      caption: 'Der Name des Veranstalters'
    contactEmail:
      label: 'Kontakt-E-Mail'
      caption: 'Die Kontakt-E-Mail-Adresse der Veranstaltung'
    startAt:
      label: 'Startzeit'
      caption: 'Startdatum und -uhrzeit der Veranstaltung'
    endAt:
      label: 'Endzeit'
      caption: 'Enddatum und -uhrzeit der Veranstaltung'
    location:
      label: 'Ort'
      caption: 'Der Ort der Veranstaltung'
    countries:
      label: 'Länder'
      caption: 'Liste aller teilnehmenden Länder'
    minAge:
      label: 'Mindestalter'
      caption: 'Das Mindestalter der Teilnehmer'
    maxAge:
      label: 'Höchstalter'
      caption: 'Das Höchstalter der Teilnehmer'
    maxParticipants:
      label: 'Maximale Teilnehmerzahl'
      caption: 'Die maximale Teilnehmerzahl'
</i18n>

<i18n lang="yaml" locale="fr">
token:
  registration:
    label: 'Inscription'
    caption: "Données issues de l'inscription du participant"
    changes:
      label: 'Modifications'
      caption: 'Les champs modifiés, avec leurs nouvelles valeurs'
    group:
      label: 'Groupe'
      caption: 'Le pays du groupe choisi'
    createdAt:
      label: 'Inscrit le'
      caption: "Date et heure de l'inscription"
  participant:
    label: 'Participant'
    caption: 'Nom, contact et rôle, quel que soit le champ du formulaire qui les contient'
    firstName:
      label: 'Prénom'
      caption: 'Le prénom du participant'
    lastName:
      label: 'Nom de famille'
      caption: 'Le nom de famille du participant'
    email:
      label: 'Email'
      caption: "La première adresse email de l'inscription"
    phone:
      label: 'Numéro de téléphone'
      caption: "Le premier numéro de téléphone de l'inscription"
    dateOfBirth:
      label: 'Date de naissance'
      caption: 'La date de naissance du participant'
    role:
      label: 'Rôle'
      caption: 'Le rôle du participant'
  address:
    label: 'Adresse'
    caption: 'L’adresse postale du participant'
    street:
      label: 'Rue'
      caption: 'Rue et numéro'
    zipCode:
      label: 'Code postal'
      caption: 'Le code postal'
    city:
      label: 'Ville'
      caption: 'La ville'
    country:
      label: 'Pays'
      caption: 'Le pays, par son nom'
  form:
    label: "Formulaire d'inscription"
    caption: "La réponse à n'importe quel champ du formulaire d'inscription"
  payment:
    label: 'Paiement'
    caption: 'Prix et référence du virement'
    price:
      label: 'Prix'
      caption: 'Coût de cette inscription, avec devise'
    reference:
      label: 'Référence du virement'
      caption: 'À indiquer dans le libellé du virement, p. ex. K7MX-0042'
  event:
    label: 'Événement'
    caption: "Informations générales sur l'événement"
    name:
      label: 'Nom'
      caption: "Le nom de l'événement"
    organizer:
      label: 'Organisateur'
      caption: "Le nom de l'organisateur"
    contactEmail:
      label: 'Email de contact'
      caption: "L'adresse email de contact de l'événement"
    startAt:
      label: 'Heure de début'
      caption: "Date et heure de début de l'événement"
    endAt:
      label: 'Heure de fin'
      caption: "Date et heure de fin de l'événement"
    location:
      label: 'Lieu'
      caption: "Le lieu de l'événement"
    countries:
      label: 'Pays'
      caption: 'Liste de tous les pays participants'
    minAge:
      label: 'Âge minimum'
      caption: "L'âge minimum des participants"
    maxAge:
      label: 'Âge maximum'
      caption: "L'âge maximum des participants"
    maxParticipants:
      label: 'Nombre maximum de participants'
      caption: 'Le nombre maximum de participants'
</i18n>

<i18n lang="yaml" locale="pl">
token:
  registration:
    label: 'Rejestracja'
    caption: 'Dane z rejestracji uczestnika'
    changes:
      label: 'Zmiany'
      caption: 'Zmienione pola wraz z ich nowymi wartościami'
    group:
      label: 'Grupa'
      caption: 'Kraj wybranej grupy'
    createdAt:
      label: 'Data zgłoszenia'
      caption: 'Data i godzina zgłoszenia'
  participant:
    label: 'Uczestnik'
    caption: 'Imię, nazwisko, kontakt i rola, niezależnie od pola formularza'
    firstName:
      label: 'Imię'
      caption: 'Imię uczestnika'
    lastName:
      label: 'Nazwisko'
      caption: 'Nazwisko uczestnika'
    email:
      label: 'E-mail'
      caption: 'Pierwszy adres e-mail zgłoszenia'
    phone:
      label: 'Numer telefonu'
      caption: 'Pierwszy numer telefonu zgłoszenia'
    dateOfBirth:
      label: 'Data urodzenia'
      caption: 'Data urodzenia uczestnika'
    role:
      label: 'Rola'
      caption: 'Rola uczestnika'
  address:
    label: 'Adres'
    caption: 'Adres pocztowy uczestnika'
    street:
      label: 'Ulica'
      caption: 'Ulica i numer domu'
    zipCode:
      label: 'Kod pocztowy'
      caption: 'Kod pocztowy'
    city:
      label: 'Miejscowość'
      caption: 'Miejscowość'
    country:
      label: 'Kraj'
      caption: 'Nazwa kraju'
  form:
    label: 'Formularz rejestracyjny'
    caption: 'Odpowiedź na dowolne pole formularza rejestracyjnego'
  payment:
    label: 'Płatność'
    caption: 'Cena i tytuł przelewu'
    price:
      label: 'Cena'
      caption: 'Koszt tego zgłoszenia, z walutą'
    reference:
      label: 'Tytuł przelewu'
      caption: 'Do wpisania w tytule przelewu, np. K7MX-0042'
  event:
    label: 'Wydarzenie'
    caption: 'Ogólne informacje o wydarzeniu'
    name:
      label: 'Nazwa'
      caption: 'Nazwa wydarzenia'
    organizer:
      label: 'Organizator'
      caption: 'Nazwa organizatora'
    contactEmail:
      label: 'E-mail kontaktowy'
      caption: 'Kontaktowy adres e-mail wydarzenia'
    startAt:
      label: 'Czas rozpoczęcia'
      caption: 'Data i godzina rozpoczęcia wydarzenia'
    endAt:
      label: 'Czas zakończenia'
      caption: 'Data i godzina zakończenia wydarzenia'
    location:
      label: 'Miejsce'
      caption: 'Miejsce wydarzenia'
    countries:
      label: 'Kraje'
      caption: 'Lista wszystkich uczestniczących krajów'
    minAge:
      label: 'Minimalny wiek'
      caption: 'Minimalny wiek uczestników'
    maxAge:
      label: 'Maksymalny wiek'
      caption: 'Maksymalny wiek uczestników'
    maxParticipants:
      label: 'Maksymalna liczba uczestników'
      caption: 'Maksymalna liczba uczestników'
</i18n>

<i18n lang="yaml" locale="cs">
token:
  registration:
    label: 'Registrace'
    caption: 'Údaje z registrace účastníka'
    changes:
      label: 'Změny'
      caption: 'Změněná pole a jejich nové hodnoty'
    group:
      label: 'Skupina'
      caption: 'Země zvolené skupiny'
    createdAt:
      label: 'Datum registrace'
      caption: 'Datum a čas registrace'
  participant:
    label: 'Účastník'
    caption: 'Jméno, kontakt a role, ať jsou v kterémkoli poli formuláře'
    firstName:
      label: 'Jméno'
      caption: 'Jméno účastníka'
    lastName:
      label: 'Příjmení'
      caption: 'Příjmení účastníka'
    email:
      label: 'E-mail'
      caption: 'První e-mailová adresa registrace'
    phone:
      label: 'Telefonní číslo'
      caption: 'První telefonní číslo registrace'
    dateOfBirth:
      label: 'Datum narození'
      caption: 'Datum narození účastníka'
    role:
      label: 'Role'
      caption: 'Role účastníka'
  address:
    label: 'Adresa'
    caption: 'Poštovní adresa účastníka'
    street:
      label: 'Ulice'
      caption: 'Ulice a číslo domu'
    zipCode:
      label: 'PSČ'
      caption: 'Poštovní směrovací číslo'
    city:
      label: 'Obec'
      caption: 'Obec'
    country:
      label: 'Země'
      caption: 'Název země'
  form:
    label: 'Registrační formulář'
    caption: 'Odpověď na libovolné pole registračního formuláře'
  payment:
    label: 'Platba'
    caption: 'Cena a reference platby'
    price:
      label: 'Cena'
      caption: 'Cena této registrace, s měnou'
    reference:
      label: 'Reference platby'
      caption: 'Do zprávy pro příjemce u převodu, např. K7MX-0042'
  event:
    label: 'Akce'
    caption: 'Obecné informace o akci'
    name:
      label: 'Název'
      caption: 'Název akce'
    organizer:
      label: 'Organizátor'
      caption: 'Název organizátora'
    contactEmail:
      label: 'Kontaktní e-mail'
      caption: 'Kontaktní e-mailová adresa akce'
    startAt:
      label: 'Čas začátku'
      caption: 'Datum a čas začátku akce'
    endAt:
      label: 'Čas konce'
      caption: 'Datum a čas konce akce'
    location:
      label: 'Místo'
      caption: 'Místo konání akce'
    countries:
      label: 'Země'
      caption: 'Seznam všech zúčastněných zemí'
    minAge:
      label: 'Minimální věk'
      caption: 'Minimální věk účastníků'
    maxAge:
      label: 'Maximální věk'
      caption: 'Maximální věk účastníků'
    maxParticipants:
      label: 'Maximální počet účastníků'
      caption: 'Maximální počet účastníků'
</i18n>
