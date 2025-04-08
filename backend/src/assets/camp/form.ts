// TODO Set file IDs
import config from '#config/index';

const host = config.origin;

export default {
  locale: 'de',
  title: '{camp.name}',
  description: '{camp.startAtDate} - {camp.endAtDate}',
  logoWidth: 'auto',
  logoHeight: '80px',
  logoPosition: 'right',
  completedHtml: {
    de: '<h3>Vielen Dank für deine Anmeldung!</h3><p stype="font-size: 18px">Du solltest in kurze eine Bestätigungsmail erhalten.</p>',
    fr: '<h3>Merci de t\'inscrire!</h3><p stype="font-size : 18px">Tu devrais recevoir un e-mail de confirmation dans les plus brefs délais.</p>',
    default:
      '<h3>Thank you for your registration!<p stype="font-size: 18px">You should receive a confirmation email shortly.</p>',
  },
  pages: [
    {
      name: 'p_overview',
      elements: [
        {
          type: 'expression',
          name: 'i_date',
          title: {
            de: 'Datum',
            fr: 'Date',
            default: 'Date',
          },
          description: {
            de: '{camp.startAtDate} bis {camp.endAtDate}',
            fr: '{camp.startAtDate} au {camp.endAtDate}',
            default: '{camp.startAtDate} until {camp.endAtDate}  ',
          },
        },
        {
          type: 'expression',
          name: 'i_age',
          title: {
            de: 'Alter',
            fr: 'Âge',
            default: 'Age',
          },
          description: {
            de: '{camp.minAge} bis {camp.maxAge}',
            fr: '{camp.minAge} à {camp.maxAge}',
            default: '{camp.minAge} to {camp.maxAge}',
          },
        },
        {
          type: 'expression',
          name: 'i_location',
          title: {
            de: 'Ort',
            fr: 'Lieu',
            default: 'Location',
          },
          description: '{camp.location}',
        },
        {
          type: 'expression',
          name: 'i_price',
          title: {
            de: 'Preis',
            fr: 'Prix',
            default: 'Price',
          },
          description: '{camp.price} €',
          currency: 'EUR',
        },
        {
          type: 'role',
          name: 'role',
          title: {
            fr: 'Rôle',
            de: 'Rolle',
            default: 'Role',
          },
          defaultValue: 'participant',
          isRequired: true,
          campDataType: 'role',
        },
      ],
      title: {
        de: 'Informationen',
        fr: 'Informations',
        default: 'Information',
      },
    },
    {
      name: 'p_general_information',
      elements: [
        {
          type: 'text',
          name: 'first_name',
          title: {
            de: 'Vorname',
            fr: 'Prénom',
            default: 'First Name',
          },
          isRequired: true,
          campDataType: 'first_name',
          autocomplete: 'given-name',
        },
        {
          type: 'text',
          name: 'last_name',
          startWithNewLine: false,
          title: {
            de: 'Nachname',
            fr: 'Nom de Famille',
            default: 'Last Name',
          },
          isRequired: true,
          campDataType: 'last_name',
          autocomplete: 'family-name',
        },
        {
          type: 'dropdown',
          name: 'gender',
          title: {
            de: 'Geschlecht',
            fr: 'Sexe',
            default: 'Gender',
          },
          isRequired: true,
          choices: [
            {
              value: 'm',
              text: {
                de: 'männlich',
                default: 'male',
                fr: 'masculin',
              },
            },
            {
              value: 'f',
              text: {
                de: 'weiblich',
                default: 'female',
                fr: 'féminin',
              },
            },
            {
              value: 'd',
              text: {
                de: 'divers',
                default: 'divers',
                fr: 'divers',
              },
            },
          ],
          autocomplete: 'sex',
        },
        {
          type: 'date_of_birth',
          name: 'date_of_birth',
          visibleIf: "{role} = 'participant'",
          title: {
            default: 'Date of Birth',
            de: 'Geburtsdatum',
            fr: 'Date de naissance',
          },
          isRequired: true,
          campDataType: 'date_of_birth',
        },
        {
          type: 'text',
          name: 'counselor_date_of_birth',
          visibleIf: "{role} <> 'participant'",
          title: {
            default: 'Date of Birth',
            de: 'Geburtsdatum',
            fr: 'Date de naissance',
          },
          valueName: 'date_of_birth',
          isRequired: true,
          campDataType: 'date_of_birth',
          inputType: 'date',
          autocomplete: 'bday',
          placeholder: {
            de: 'tt.mm.jjjj',
            fr: 'jj.mm.aaaa',
            default: 'dd.mm.yyyy',
          },
        },
      ],
      title: {
        de: 'Allgemeine Informationen',
        fr: 'Informations générales',
        default: 'General Information',
      },
    },
    {
      name: 'p_contact',
      elements: [
        {
          type: 'address',
          name: 'address',
          title: {
            de: 'Adresse',
            default: 'Address',
            fr: 'Adresse',
          },
          isRequired: true,
          campDataType: 'address',
        },
        {
          type: 'text',
          name: 'email',
          title: {
            de: 'E-Mail',
            fr: 'E-Mail',
            default: 'E-Mail',
          },
          isRequired: true,
          campDataType: 'email',
          inputType: 'email',
          autocomplete: 'email',
        },
        {
          type: 'text',
          name: 'phone_number',
          title: {
            de: 'Handynummer',
            fr: 'Numéro de portable',
            default: 'Phone Number',
          },
          description: {
            de: 'Wenn du keine eigene Telefonnummer hast, kannst du dieses Feld leer lassen',
            fr: "Si tu n'as pas de numéro de téléphone personnel, tu peux laisser ce champ vide",
            default:
              'If you do not have your own telephone number, you can leave this field blank',
          },
          requiredIf: '{isadult}',
          inputType: 'tel',
          autocomplete: 'tel',
        },
        {
          type: 'boolean',
          name: 'waiting_list',
          visible: false,
          visibleIf: '{waitingList} = true',
          title: {
            de: 'Warteliste',
            fr: "Liste d'attente",
            default: 'Waiting list',
          },
          description: {
            de: 'Leider sind bereits alle Plätze für Teilnehmer aus diesem Land belegt. Du kannst dich aber auf die Warteliste setzten. Wir informieren dich dann sobald ein Platz frei wird.',
            fr: "Malheureusement, toutes les places pour les participants de ce pays sont déjà prises. Tu peux toutefois t'inscrire sur la liste d'attente. Nous t'informerons dès qu'une place se libérera.",
            default:
              'Unfortunately, all places for participants from this country are already taken. However, you can put your name on the waiting list. We will inform you as soon as a place becomes available.',
          },
          correctAnswer: true,
          isRequired: true,
          validators: [
            {
              type: 'expression',
              text: {
                de: 'Bitte bestätige, dass du auf die Warteliste möchtest',
                fr: "Confirme que tu souhaites être sur la liste d'attente",
                default:
                  "Confirme que tu souhaites être sur la liste d'attente",
              },
              expression: '{waiting_list} = true',
            },
          ],
        },
      ],
      title: {
        de: 'Kontaktinformationen',
        fr: 'Coordonnées',
        default: 'Contact Information',
      },
    },
    {
      name: 'p_guardian',
      elements: [
        {
          type: 'text',
          name: 'guardian_first_name',
          title: {
            de: 'Vorname',
            fr: 'Prénom',
            default: 'First Name',
          },
          isRequired: true,
          autocomplete: 'given-name',
        },
        {
          type: 'text',
          name: 'guardian_last_name',
          startWithNewLine: false,
          title: {
            de: 'Nachname',
            fr: 'Nom',
            default: 'Last Name',
          },
          isRequired: true,
          autocomplete: 'family-name',
        },
        {
          type: 'text',
          name: 'guardian_email',
          title: 'E-Mail',
          isRequired: true,
          campDataType: 'email',
          inputType: 'email',
          autocomplete: 'email',
        },
      ],
      visibleIf: '{isminor}',
      title: {
        de: 'Informationen über Sorgeberechtigten',
        fr: 'Informations sur les tuteurs légaux',
        default: 'Information about legal guardians',
      },
    },
    {
      name: 'p_emergency_contact',
      elements: [
        {
          type: 'paneldynamic',
          name: 'guardian_emergency_contacts',
          title: {
            de: 'Erreichbarkeit in Notfällen',
            fr: "Contacts en cas d'urgence",
            default: 'Emergency contacts',
          },
          description: {
            de: 'Wen können wir in Notfällen kontaktieren? Es können mehrere Kontakte angegeben werden.',
            default:
              'Who can we contact in an emergency? Several contacts can be specified.',
            fr: "Qui peut-on contacter en cas d'urgence ? Il est possible d'indiquer plusieurs contacts.",
          },
          valueName: 'emergency_contacts',
          isRequired: true,
          requiredIf: '{isminor} = true',
          templateElements: [
            {
              type: 'text',
              name: 'emergency_contact_description',
              title: {
                de: 'Beschreibung',
                fr: 'Description',
                default: 'Description',
              },
              description: {
                de: 'z.B. Mutter, Vater, Festnetz, ...',
                default: 'e.g. mother, father, landline, ...',
                fr: 'p.ex. mère, père, téléphone fixe, ...',
              },
              valueName: 'description',
              isRequired: true,
            },
            {
              type: 'text',
              name: 'guardian_phone_number',
              title: {
                de: 'Telefonnummer',
                fr: 'Numéro de Téléphone',
                default: 'Phone Number',
              },
              description: {
                de: 'mit Ländervorwahl',
                default: 'with country code',
                fr: "avec l'indicatif du pays",
              },
              valueName: 'phone_number',
              isRequired: true,
              inputType: 'tel',
              autocomplete: 'tel',
            },
          ],
          noEntriesText: {
            de: 'Es gibt noch keine Kontakte. Klicke auf die Schaltfläche unten, um einen neuen Kontakt hinzuzufügen.',
            fr: "Il n'y a pas encore de contacts. Clique sur le bouton ci-dessous pour ajouter un nouveau contact.",
            default:
              'There are no contacts yet. Click on the button below to add a new contact.',
          },
          panelCount: 1,
          minPanelCount: 1,
          maxPanelCount: 3,
          panelAddText: {
            de: 'Kontakt hinzufügen',
            fr: 'Ajouter un contact',
            default: 'Add contact',
          },
        },
      ],
      title: {
        de: 'Notfallkontakte',
        default: 'Emergency contacts',
        fr: "Contacts en cas d'urgence",
      },
    },
    {
      name: 'p_permissions',
      elements: [
        {
          type: 'boolean',
          name: 'permission_swim',
          title: {
            de: '{first_name} kann und darf frei schwimmen',
            fr: '{first_name} peut et sait nager librement',
            default: '{first_name} can and may swim freely',
          },
          isRequired: true,
          labelTrue: {
            de: 'Ja',
            fr: 'Oui',
            default: 'Yes',
          },
          labelFalse: {
            de: 'Nein',
            fr: 'Non',
            default: 'No',
          },
        },
        {
          type: 'boolean',
          name: 'permission_written_consent',
          title: {
            de: '{first_name} darf an Freizeitaktivitäten teilnehmen, bei denen der Veranstalter eine schriftliche Einverständniserklärung der Sorgeberechtigten benötigt',
            fr: "{first_name} peut participer à des activités de loisirs pour lesquelles l'organisateur a besoin d'une autorisation écrite du titulaire de l'autorité parentale",
            default:
              '{first_name} may participate in leisure activities for which the organizer requires a written declaration of consent from the legal guardian',
          },
          description: {
            de: 'z.B. Kletterpark, Go-Kart oder ähnliches',
            default: 'e.g. climbing park, go-karting or similar',
            fr: "p. ex. parc d'escalade, karting ou autre",
          },
          isRequired: true,
          labelTrue: {
            de: 'Ja',
            fr: 'Oui',
            default: 'Yes',
          },
          labelFalse: {
            de: 'Nein',
            fr: 'Non',
            default: 'No',
          },
        },
        {
          type: 'dropdown',
          name: 'permission_leave',
          title: {
            de: '{first_name} darf in Absprache mit der Lagerleitung das Camp bzw. den Aufsichtsbereich der Lagerleitung verlassen',
            default:
              "{first_name} may leave the camp or the camp management's supervision area in consultation with the camp management",
            fr: '{first_name} est autorisé à quitter le camp ou la zone de surveillance de la direction du camp en accord avec celle-ci',
          },
          isRequired: true,
          choices: [
            {
              value: 2,
              text: {
                de: 'Alleine',
                fr: 'Seul',
                default: 'Alone',
              },
            },
            {
              value: 1,
              text: {
                de: 'In Gruppen von mindestens 3 Personen',
                fr: "En groupes d'au moins 3 personnes",
                default: 'In groups of at least 3 people',
              },
            },
            {
              value: 0,
              text: {
                de: 'Nein',
                fr: 'Non',
                default: 'No',
              },
            },
          ],
          placeholder: {
            de: 'Auswahl...',
            fr: 'Sélection...',
            default: 'Selection...',
          },
        },
      ],
      visibleIf: '{isminor}',
      title: {
        de: 'Berechtigungen',
        fr: 'Autorisations',
        default: 'Permissions',
      },
    },
    {
      name: 'p_additional_information',
      elements: [
        {
          type: 'text',
          name: 'medical_restrictions',
          title: {
            de: 'Medizinische Einschränkungen',
            fr: 'Restrictions médicales',
            default: 'Medical Restrictions',
          },
          description: {
            de: 'Krankheiten, Allergien oder sonstige Einschränkungen, die für das Camp relevant sein könnten',
            fr: 'Maladies, allergies ou autres restrictions qui pourraient être pertinentes pour le camp',
            default:
              'Illnesses, allergies or other restrictions that could be relevant for the camp',
          },
        },
        {
          type: 'text',
          name: 'food_intolerance',
          title: {
            de: 'Besondere Ernährung',
            fr: 'Alimentation spéciale',
            default: 'Special nutrition',
          },
          description: {
            de: 'Vegetarisch, Vegan o.Ä.',
            fr: 'Végétarien, végétalien, etc.',
            default: 'Vegetarian, vegan, etc.',
          },
        },
        {
          type: 'comment',
          name: 'additional_information',
          title: {
            de: 'Sonstige Informationen',
            fr: 'Autres informations',
            default: 'Additional information',
          },
          description: {
            de: 'Hier kannst du uns noch weitere Informationen mitteilen.',
            default: 'You can give us more information here.',
            fr: "Ici, tu peux nous communiquer d'autres informations.",
          },
        },
      ],
      title: {
        de: 'Weitere Informationen',
        fr: 'Informations supplémentaires',
        default: 'Additional Information',
      },
    },
    {
      name: 'p_consent',
      elements: [
        {
          type: 'boolean',
          name: 'consent_rules',
          title: {
            de: `Ich habe die [Campregeln](${host}/) gelesen und bin damit einverstanden.`,
            fr: `J'ai lu et j'accepte le [règlement](${host}/) de la colonie de vacances.`,
            default: `I have read the [camp rules](${host}/) and agree to them.`,
          },
          correctAnswer: true,
          isRequired: true,
          requiredErrorText: {
            de: 'Du musst den Campregeln zustimmen, um am Camp teilnehmen zu können',
            fr: 'Tu dois accepter le règlement du camp pour pouvoir y participer.',
            default:
              'You must agree to the camp rules in order to participate in the camp',
          },
          validators: [
            {
              type: 'expression',
              text: {
                de: 'Du musst den Campregeln zustimmen, um am Camp teilnehmen zu können',
                fr: 'Tu dois accepter le règlement du camp pour pouvoir y participer.',
                default:
                  'You must agree to the camp rules in order to participate in the camp',
              },
              expression: '{consent_rules} = true',
            },
          ],
        },
        {
          type: 'boolean',
          name: 'consent_general_terms_and_conditions',
          title: {
            de: `Ich habe die [allgemeinen Geschäftsbedingungen](${host}/) gelesen und stimme diesen zu.`,
            fr: `J'ai lu et j'accepte les [conditions générales](${host}/).`,
            default: `I have read the [General Terms and Conditions](${host}/) and agree to them.`,
          },
          correctAnswer: true,
          isRequired: true,
          requiredErrorText: {
            de: 'Du musst unseren AGB zustimmen, um teilnehmen zu können!',
            fr: 'Tu dois accepter nos conditions générales pour pouvoir participer !',
            default:
              'You must agree to our terms and conditions in order to participate!',
          },
          validators: [
            {
              type: 'expression',
              text: {
                de: 'Du musst unseren AGB zustimmen, um teilnehmen zu können!',
                fr: 'Tu dois accepter nos conditions générales pour pouvoir participer !',
                default:
                  'You must agree to our terms and conditions in order to participate!',
              },
              expression: '{consent_general_terms_and_conditions} = true',
            },
          ],
        },
        {
          type: 'boolean',
          name: 'consent_forward_list_participants',
          title: {
            de: 'Ich stimme zu, dass meine Kontaktdaten (Anschrift, E-Mail, Telefon) in Form einer Teilnehmerliste zur Bildung von Fahrgemeinschaften ausschließlich an andere Teilnehmer des Camps weitergeleitet werden dürfen.',
            fr: "J'accepte que mes coordonnées (adresse, e-mail, téléphone) soient transmises exclusivement aux autres participants du camp de vacances sous la forme d'une liste de participants pour le covoiturage.",
            default:
              'I agree that my contact details (address, e-mail, telephone) may only be passed on to other camp participants in the form of a list of participants for the purpose of carpooling.',
          },
        },
        {
          type: 'boolean',
          name: 'consent_privacy',
          title: {
            de: 'Ich stimme zu, dass von dem Teilnehmenden, {first_name} {last_name} Aufnahmen erstellt werden dürfen und dem Veranstalter zum Zwecke der Berichterstattung in Medien und für Werbezwecke zur Verfügung gestellt werden.',
            fr: "J'accepte que des photos du participant, {first_name} {last_name}, soient prises et mises à la disposition de l'organisateur à des fins de reportage dans les médias et de publicité.",
            default:
              'I agree that photographs of the participant, {first_name} {last_name}, may be taken and made available to the organizer for the purpose of media coverage and advertising.',
          },
          description: {
            de: 'Die Zustimmung ist Freiwillig und kann jederzeit ohne Angabe von Gründen widerrufen werden.',
            fr: 'Le consentement est volontaire et peut être retiré à tout moment sans justification.',
            default:
              'Consent is voluntary and can be revoked at any time without giving reasons.',
          },
        },
        {
          type: 'boolean',
          name: 'confirmation_guardian',
          visibleIf: '{isminor} = true',
          title: {
            de: 'Ich bestätige, dass ich Sorgeberechtige:r von {first_name} {last_name} bin.',
            default:
              'I confirm that I am the legal guardian of {first_name} {last_name}.',
            fr: "Je confirme que je suis l'autorité parentale de {first_name} {last_name}.",
          },
          correctAnswer: false,
          isRequired: true,
          validators: [
            {
              type: 'expression',
              text: {
                de: 'Sie müssen Sorgeberechtigte:r sein',
                fr: "Vous devez être titulaire de l'autorité parentale",
                default: 'You must be a legal guardian',
              },
              expression: '{confirmation_guardian} = true',
            },
          ],
        },
      ],
      title: {
        fr: 'Approbations',
        default: 'Consents',
        de: 'Zustimmung',
      },
    },
  ],
  calculatedValues: [
    {
      name: 'isadult',
      expression: 'isAdult({date_of_birth}, {camp.startAt})',
    },
    {
      name: 'isminor',
      expression: 'isMinor({date_of_birth}, {camp.startAt})',
    },
    {
      name: 'waitingList',
      expression: 'isWaitingList({camp.freePlaces}, {country})',
    },
  ],
  showQuestionNumbers: 'off',
  showProgressBar: 'bottom',
  completeText: {
    de: 'Kostenpflichtig Anmelden',
    fr: 'Inscription payante',
    default: 'Register for a fee',
  },
  widthMode: 'responsive',
};
