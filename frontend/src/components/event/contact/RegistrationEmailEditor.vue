<template>
  <email-editor
    v-model="model"
    :tokens
  />
</template>

<script setup lang="ts">
import type { EventDetails } from '@camp-registration/common/entities';
import { computed } from 'vue';
import { extractFormFields } from '@/utils/surveyJS';
import EmailEditor from '@/components/event/contact/EmailEditor.vue';
import { useI18n } from 'vue-i18n';
import type {
  RegistrationComputedPath,
  RegistrationDataPath,
  TokenNode,
  TokenValue,
} from '@/components/event/contact/TokenNode';

const { t } = useI18n();

const model = defineModel<string>({
  required: true,
});

const { form, trigger } = defineProps<{
  form: EventDetails['form'] | undefined;
  trigger?: string | undefined;
}>();

// Payment tokens are only meaningful on messages that are actually about a
// payment — showing them elsewhere would suggest they populate emails
// (e.g. registration confirmation) that never reference a payment at all.
const PAYMENT_TRIGGERS = [
  'payment_requested',
  'payment_received',
  'payment_failed',
  'payment_refunded',
  'payment_reminder',
];

const eventTokens: (keyof EventDetails)[] = [
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
      value: 'event',
      label: t('token.event.label'),
      caption: t('token.event.caption'),
      items: eventTokens.map((value) => ({
        label: t(`token.event.item.${value}.label`),
        caption: t(`token.event.item.${value}.caption`),
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
        ...(trigger === 'registration_updated'
          ? [
              {
                value: 'changes',
                label: t('token.registration.changes.label'),
                caption: t('token.registration.changes.caption'),
              },
            ]
          : []),
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
    ...(trigger && PAYMENT_TRIGGERS.includes(trigger)
      ? [
          {
            value: 'payment',
            label: t('token.payment.label'),
            caption: t('token.payment.caption'),
            items: [
              {
                value: 'amount',
                label: t('token.payment.amount.label'),
                caption: t('token.payment.amount.caption'),
              },
              {
                value: 'url',
                label: t('token.payment.url.label'),
                caption: t('token.payment.url.caption'),
              },
            ],
          },
        ]
      : []),
    ...(trigger === 'payment_refunded'
      ? [
          {
            value: 'refund',
            label: t('token.refund.label'),
            caption: t('token.refund.caption'),
            items: [
              {
                value: 'amount',
                label: t('token.refund.amount.label'),
                caption: t('token.refund.amount.caption'),
              },
              {
                value: 'reason',
                label: t('token.refund.reason.label'),
                caption: t('token.refund.reason.caption'),
              },
            ],
          },
        ]
      : []),
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
  payment:
    label: 'Payment'
    caption: 'What the participant owes and where to pay (empty when no payment is due)'
    amount:
      label: 'Amount'
      caption: 'The amount due, formatted in the event currency'
    url:
      label: 'Payment link'
      caption: "Link to the participant's personal payment page"
  refund:
    label: 'Refund'
    caption: 'The refund this email is about'
    amount:
      label: 'Amount'
      caption: 'The refunded amount'
    reason:
      label: 'Reason'
      caption: 'The reason entered for the refund'
  event:
    label: 'Event'
    caption: 'General information about the event'
    item:
      countries:
        label: 'Countries'
        caption: 'List of all participating countries'
      name:
        label: 'Name'
        caption: 'The name of the event'
      organizer:
        label: 'Organizer'
        caption: 'The name of the organizer'
      contactEmail:
        label: 'Contact email'
        caption: 'The contact email address of the event'
      maxParticipants:
        label: 'Maximum number of participants'
        caption: 'The maximum number of participants'
      startAt:
        label: 'Start time'
        caption: 'Start date and time of the event'
      endAt:
        label: 'End time'
        caption: 'End date and time of the event'
      minAge:
        label: 'Minimum age'
        caption: 'The minimum age of the participants'
      maxAge:
        label: 'Maximum age'
        caption: 'The maximum age of the participants'
      location:
        label: 'Location'
        caption: 'The location of the event'
      price:
        label: 'Price'
        caption: 'The participation fee'
  registration:
    label: 'Registration'
    caption: 'Data submitted by the participant during registration'
    data:
      label: 'Form'
      caption: 'Direct access to registration form fields'
    changes:
      label: 'Changes'
      caption: 'The fields this edit changed, with their new values'
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
  payment:
    label: 'Zahlung'
    caption: 'Was die teilnehmende Person schuldet und wo sie bezahlt (leer, wenn nichts fällig ist)'
    amount:
      label: 'Betrag'
      caption: 'Der fällige Betrag in der Währung der Veranstaltung'
    url:
      label: 'Zahlungslink'
      caption: 'Link zur persönlichen Zahlungsseite der teilnehmenden Person'
  refund:
    label: 'Erstattung'
    caption: 'Die Erstattung, um die es in dieser E-Mail geht'
    amount:
      label: 'Betrag'
      caption: 'Der erstattete Betrag'
    reason:
      label: 'Grund'
      caption: 'Der für die Erstattung angegebene Grund'
  event:
    label: 'Veranstaltung'
    caption: 'Allgemeine Informationen zur Veranstaltung'
    item:
      countries:
        label: 'Länder'
        caption: 'Liste aller teilnehmenden Länder'
      name:
        label: 'Name'
        caption: 'Der Name der Veranstaltung'
      organizer:
        label: 'Veranstalter'
        caption: 'Der Name des Veranstalters'
      contactEmail:
        label: 'Kontakt-E-Mail'
        caption: 'Die Kontakt-E-Mail-Adresse der Veranstaltung'
      maxParticipants:
        label: 'Maximale Teilnehmerzahl'
        caption: 'Die maximale Teilnehmerzahl'
      startAt:
        label: 'Startzeit'
        caption: 'Startdatum und -uhrzeit der Veranstaltung'
      endAt:
        label: 'Endzeit'
        caption: 'Enddatum und -uhrzeit der Veranstaltung'
      minAge:
        label: 'Mindestalter'
        caption: 'Das Mindestalter der Teilnehmer'
      maxAge:
        label: 'Höchstalter'
        caption: 'Das Höchstalter der Teilnehmer'
      location:
        label: 'Ort'
        caption: 'Der Ort der Veranstaltung'
      price:
        label: 'Preis'
        caption: 'Der Teilnahmebeitrag'
  registration:
    label: 'Anmeldung'
    caption: 'Daten aus der Anmeldung des Teilnehmers'
    data:
      label: 'Formular'
      caption: 'Direkter Zugriff auf die Felder des Anmeldeformulars'
    changes:
      label: 'Änderungen'
      caption: 'Die geänderten Felder mit ihren neuen Werten'
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
  payment:
    label: 'Paiement'
    caption: "Ce que le participant doit et où payer (vide s'il n'y a rien à payer)"
    amount:
      label: 'Montant'
      caption: "Le montant dû, dans la devise de l'événement"
    url:
      label: 'Lien de paiement'
      caption: 'Lien vers la page de paiement personnelle du participant'
  refund:
    label: 'Remboursement'
    caption: 'Le remboursement dont traite cet e-mail'
    amount:
      label: 'Montant'
      caption: 'Le montant remboursé'
    reason:
      label: 'Motif'
      caption: 'Le motif saisi pour le remboursement'
  event:
    label: 'Événement'
    caption: "Informations générales sur l'événement"

    item:
      countries:
        label: 'Pays'
        caption: 'Liste de tous les pays participants'
      name:
        label: 'Nom'
        caption: "Le nom de l'événement"

      organizer:
        label: 'Organisateur'
        caption: "Le nom de l'organisateur"
      contactEmail:
        label: 'Email de contact'
        caption: "L'adresse email de contact de l'événement"
      maxParticipants:
        label: 'Nombre maximum de participants'
        caption: 'Le nombre maximum de participants'
      startAt:
        label: 'Heure de début'
        caption: "Date et heure de début de l'événement"

      endAt:
        label: 'Heure de fin'
        caption: "Date et heure de fin de l'événement"

      minAge:
        label: 'Âge minimum'
        caption: "L'âge minimum des participants"
      maxAge:
        label: 'Âge maximum'
        caption: "L'âge maximum des participants"
      location:
        label: 'Lieu'
        caption: "Le lieu de l'événement"

      price:
        label: 'Prix'
        caption: 'Les frais de participation'
  registration:
    label: 'Inscription'
    caption: "Données issues de l'inscription du participant"
    data:
      label: 'Formulaire'
      caption: "Accès direct aux champs du formulaire d'inscription"
    changes:
      label: 'Modifications'
      caption: 'Les champs modifiés, avec leurs nouvelles valeurs'
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
  payment:
    label: 'Płatność'
    caption: 'Ile uczestnik jest winien i gdzie zapłacić (puste, gdy nic nie jest należne)'
    amount:
      label: 'Kwota'
      caption: 'Należna kwota w walucie wydarzenia'
    url:
      label: 'Link do płatności'
      caption: 'Link do osobistej strony płatności uczestnika'
  refund:
    label: 'Zwrot'
    caption: 'Zwrot, którego dotyczy ten e-mail'
    amount:
      label: 'Kwota'
      caption: 'Zwrócona kwota'
    reason:
      label: 'Powód'
      caption: 'Powód podany przy zwrocie'
  event:
    label: 'Wydarzenie'
    caption: 'Ogólne informacje o wydarzeniu'
    item:
      countries:
        label: 'Kraje'
        caption: 'Lista wszystkich uczestniczących krajów'
      name:
        label: 'Nazwa'
        caption: 'Nazwa wydarzenia'
      organizer:
        label: 'Organizator'
        caption: 'Nazwa organizatora'
      contactEmail:
        label: 'E-mail kontaktowy'
        caption: 'Kontaktowy adres e-mail wydarzenia'
      maxParticipants:
        label: 'Maksymalna liczba uczestników'
        caption: 'Maksymalna liczba uczestników'
      startAt:
        label: 'Czas rozpoczęcia'
        caption: 'Data i godzina rozpoczęcia wydarzenia'
      endAt:
        label: 'Czas zakończenia'
        caption: 'Data i godzina zakończenia wydarzenia'
      minAge:
        label: 'Minimalny wiek'
        caption: 'Minimalny wiek uczestników'
      maxAge:
        label: 'Maksymalny wiek'
        caption: 'Maksymalny wiek uczestników'
      location:
        label: 'Miejsce'
        caption: 'Miejsce wydarzenia'
      price:
        label: 'Cena'
        caption: 'Opłata za uczestnictwo'
  registration:
    label: 'Rejestracja'
    caption: 'Dane z rejestracji uczestnika'
    data:
      label: 'Formularz'
      caption: 'Bezpośredni dostęp do pól formularza rejestracyjnego'
    changes:
      label: 'Zmiany'
      caption: 'Zmienione pola wraz z ich nowymi wartościami'
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
  payment:
    label: 'Platba'
    caption: 'Kolik účastník dluží a kde zaplatit (prázdné, pokud nic není splatné)'
    amount:
      label: 'Částka'
      caption: 'Splatná částka v měně akce'
    url:
      label: 'Odkaz na platbu'
      caption: 'Odkaz na osobní platební stránku účastníka'
  refund:
    label: 'Vrácení'
    caption: 'Vrácení, kterého se tento e-mail týká'
    amount:
      label: 'Částka'
      caption: 'Vrácená částka'
    reason:
      label: 'Důvod'
      caption: 'Důvod zadaný u vrácení'
  event:
    label: 'Akce'
    caption: 'Obecné informace o táboře'
    item:
      countries:
        label: 'Země'
        caption: 'Seznam všech zúčastněných zemí'
      name:
        label: 'Název'
        caption: 'Název akce'
      organizer:
        label: 'Organizátor'
        caption: 'Název organizátora'
      contactEmail:
        label: 'Kontaktní e-mail'
        caption: 'Kontaktní e-mailová adresa akce'
      maxParticipants:
        label: 'Maximální počet účastníků'
        caption: 'Maximální počet účastníků'
      startAt:
        label: 'Čas začátku'
        caption: 'Datum a čas začátku akce'
      endAt:
        label: 'Čas konce'
        caption: 'Datum a čas konce akce'
      minAge:
        label: 'Minimální věk'
        caption: 'Minimální věk účastníků'
      maxAge:
        label: 'Maximální věk'
        caption: 'Maximální věk účastníků'
      location:
        label: 'Místo'
        caption: 'Místo konání akce'
      price:
        label: 'Cena'
        caption: 'Účastnický poplatek'
  registration:
    label: 'Registrace'
    caption: 'Údaje z registrace účastníka'
    data:
      label: 'Formulář'
      caption: 'Přímý přístup k polím registračního formuláře'
    changes:
      label: 'Změny'
      caption: 'Změněná pole a jejich nové hodnoty'
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
