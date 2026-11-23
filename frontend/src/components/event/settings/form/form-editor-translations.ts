import type {
  EventDataTag,
  PaymentTotalMode,
  GroupCountryMatch,
} from '@camp-registration/common/form';
import privacyCs from '@/i18n/cs-CZ/privacy';
import privacyDe from '@/i18n/de-DE/privacy';
import privacyEn from '@/i18n/en-US/privacy';
import privacyFr from '@/i18n/fr-FR/privacy';
import privacyPl from '@/i18n/pl-PL/privacy';

type QtKey = 'address' | 'country' | 'date_of_birth' | 'role';
type PropertyKey =
  | 'showPaymentTotal'
  | 'eventDataType'
  | 'groupCountryMatch'
  | 'price'
  | 'privacyCategory'
  | 'privacyConsent'
  | 'privacyConsentPurpose'
  | 'privacyConsentFor';

type LocaleSection = {
  qt: Record<QtKey, string>;
  toolboxCategories: { registration: string };
  // Property grid tabs, looked up by the creator as `pe.tabs.<category>`.
  pe: { tabs: { registration: string } };
  p: Record<PropertyKey, string>;
  pehelp: Record<PropertyKey, string>;
  // Property values, looked up by the creator as `pv.<property>.<value>`.
  pv: {
    showPaymentTotal: Record<PaymentTotalMode, string>;
    groupCountryMatch: Record<GroupCountryMatch, string>;
    // The catalogue's own labels, so a tag reads as it does in the notice.
    privacyCategory: Record<string, string>;
    privacyConsentPurpose: Record<string, string>;
    privacyConsentFor: Record<string, string>;
    eventDataType: Record<EventDataTag, string>;
  };
};

type LocaleKey = 'de' | 'en' | 'fr' | 'pl' | 'cs';

export const surveyCreatorCustomLocaleConfig: Record<LocaleKey, LocaleSection> =
  {
    de: {
      qt: {
        address: 'Adresse',
        country: 'Land',
        date_of_birth: 'Geburtstag',
        role: 'Rolle',
      },
      toolboxCategories: {
        registration: 'Anmeldung',
      },
      pe: { tabs: { registration: 'Anmeldung' } },
      p: {
        privacyCategory: 'Datenschutz-Kategorie',
        privacyConsent: 'Einwilligung',
        privacyConsentPurpose: 'Zweck der Einwilligung',
        privacyConsentFor: 'Gibt sensible Daten frei',
        eventDataType: 'Daten-Tag',
        groupCountryMatch: 'Abgleich mit der Gruppe',
        price: 'Preis',
        showPaymentTotal: 'Gesamtbetrag',
      },
      pehelp: {
        privacyCategory:
          'Welche Art personenbezogener Daten diese Frage erhebt, wie in den Datenschutzinformationen aufgeführt. Fragen zu Gesundheit, Allergien, Medikamenten, Behinderung oder Religion brauchen eine Rechtsgrundlage, meist eine Einwilligungsfrage. Nur so markierte Fragen werden als sensibel behandelt – die Plattform erkennt sensible Angaben nicht von selbst. Prüfe auch Freitextfelder.',
        privacyConsent:
          'Diese Frage holt eine Einwilligung ein. Ihr Wortlaut wird mit jeder Anmeldung gespeichert, als Nachweis, wozu die Person eingewilligt hat.',
        privacyConsentPurpose:
          'Wofür diese Einwilligung eingeholt wird, wie in den Datenschutzinformationen aufgeführt. Beim Newsletter-Versand können Anmeldungen, die zustimmen, in einen Newsletter übernommen werden.',
        privacyConsentFor:
          'Die sensiblen Daten, für die diese Einwilligung gilt. Antworten auf Fragen mit diesen Kategorien setzen sie voraus.',
        showPaymentTotal:
          'Wann das Formular den Gesamtbetrag auf der letzten Seite über dem Absende-Button zeigt. ' +
          'Wenn nicht null: nur, wenn die Anmeldung etwas kostet. ' +
          'Immer: auch 0,00 € bei einer kostenlosen Anmeldung. ' +
          'Nie: bei kostenpflichtigen Veranstaltungen nur, wenn du den Preis anderswo im Formular nennst.',
        eventDataType:
          'Wähle aus, welche Art von Daten die Person eingibt. ' +
          'Die Informationen werden dem Dienst unabhängig vom Feldnamen zur Verfügung gestellt. ' +
          '„Beeinflusst den Preis“ gibt den Antworten einen Preis.',
        price:
          'Wird zum Preis der Veranstaltung addiert, solange die Antwort gewählt und sichtbar ist. Ein negativer Betrag ist ein Rabatt.',
        groupCountryMatch:
          'Wie sich das Land zur gewählten Gruppe verhält. ' +
          'Streng: das Land der Gruppe, nicht änderbar. ' +
          'Warnen: vorausgefüllt und änderbar, mit Hinweis bei Abweichung. ' +
          'Frei: ohne Vorgabe. Bei einer Adresse gilt es für ihr Land.',
      },
      pv: {
        privacyCategory: privacyDe.dataCategory,
        privacyConsentPurpose: privacyDe.purpose,
        privacyConsentFor: privacyDe.dataCategory,
        eventDataType: {
          first_name: 'Vorname',
          last_name: 'Nachname',
          name: 'Name',
          email: 'E-Mail (Kontakt)',
          phone: 'Telefonnummer (Kontakt)',
          address: 'Adresse',
          street: 'Straße & Hausnummer',
          zip_code: 'Postleitzahl',
          city: 'Ort',
          country: 'Land',
          date_of_birth: 'Geburtsdatum',
          gender: 'Geschlecht',
          role: 'Rolle',
          payment_amount: 'Beeinflusst den Preis',
        },
        showPaymentTotal: {
          nonZero: 'Wenn nicht null',
          always: 'Immer',
          never: 'Nie',
        },
        groupCountryMatch: {
          strict: 'Streng – Land der Gruppe',
          warn: 'Warnen bei Abweichung',
          free: 'Frei',
        },
      },
    },

    en: {
      qt: {
        address: 'Address',
        country: 'Country',
        date_of_birth: 'Birthday',
        role: 'Role',
      },
      toolboxCategories: {
        registration: 'Registration',
      },
      pe: { tabs: { registration: 'Registration' } },
      p: {
        privacyCategory: 'Privacy category',
        privacyConsent: 'Consent',
        privacyConsentPurpose: 'Consent purpose',
        privacyConsentFor: 'Unlocks sensitive data',
        eventDataType: 'Data Tag',
        groupCountryMatch: 'Match with group',
        price: 'Price',
        showPaymentTotal: 'Total amount',
      },
      pehelp: {
        privacyCategory:
          'What kind of personal data this question collects, as listed in the privacy information. Questions about health, allergies, medication, disability or religion need a legal basis, usually a consent question. Only questions marked here are treated as sensitive – the platform does not detect sensitive answers by itself. Check free-text fields too.',
        privacyConsent:
          'This question asks for consent. Its wording is stored with each registration as proof of what the person agreed to.',
        privacyConsentPurpose:
          'What this consent is asked for, as listed in the privacy information. For the newsletter, registrations that agree can be imported into a newsletter.',
        privacyConsentFor:
          'The sensitive data this consent covers. Answers to questions tagged with these categories require it.',
        showPaymentTotal:
          'When the form shows the total on its last page, above the submit button. ' +
          'When not zero: only if the registration costs something. ' +
          'Always: also 0.00 for a free registration. ' +
          'Never: for a paid event, only if the form states the price elsewhere.',
        eventDataType:
          'Select what type of data the user enters. ' +
          'The information is made available to the service regardless of the field name. ' +
          '"Affects the price" gives the answers a price.',
        price:
          'Added to the event price while this answer is selected and shown. A negative amount is a discount.',
        groupCountryMatch:
          'How the country relates to the chosen group. ' +
          "Strict: the group's country, read-only. " +
          'Warn: prefilled and editable, with a notice when it differs. ' +
          'Free: no default. On an address, applies to its country.',
      },
      pv: {
        privacyCategory: privacyEn.dataCategory,
        privacyConsentPurpose: privacyEn.purpose,
        privacyConsentFor: privacyEn.dataCategory,
        eventDataType: {
          first_name: 'First name',
          last_name: 'Last name',
          name: 'Name',
          email: 'Email (contact)',
          phone: 'Phone number (contact)',
          address: 'Address',
          street: 'Street & number',
          zip_code: 'Zip code',
          city: 'City',
          country: 'Country',
          date_of_birth: 'Date of birth',
          gender: 'Gender',
          role: 'Role',
          payment_amount: 'Affects the price',
        },
        showPaymentTotal: {
          nonZero: 'When not zero',
          always: 'Always',
          never: 'Never',
        },
        groupCountryMatch: {
          strict: "Strict – group's country",
          warn: 'Warn when different',
          free: 'Free',
        },
      },
    },
    fr: {
      qt: {
        address: 'Adresse',
        country: 'Pays',
        date_of_birth: 'Date de naissance',
        role: 'Rôle',
      },
      toolboxCategories: {
        registration: 'Inscription',
      },
      pe: { tabs: { registration: 'Inscription' } },
      p: {
        privacyCategory: 'Catégorie de données personnelles',
        privacyConsent: 'Consentement',
        privacyConsentPurpose: 'Finalité du consentement',
        privacyConsentFor: 'Débloque les données sensibles',
        eventDataType: 'Étiquette de données',
        groupCountryMatch: 'Correspondance avec le groupe',
        price: 'Prix',
        showPaymentTotal: 'Montant total',
      },
      pehelp: {
        privacyCategory:
          'Le type de données personnelles que cette question collecte, tel que décrit dans les informations sur la protection des données. Les questions sur la santé, les allergies, les médicaments, le handicap ou la religion nécessitent une base légale, le plus souvent une question de consentement. Seules les questions marquées ici sont traitées comme sensibles : la plateforme ne détecte pas d’elle-même les données sensibles. Vérifie aussi les champs de texte libre.',
        privacyConsent:
          'Cette question demande un consentement. Son libellé est enregistré avec chaque inscription, comme preuve de ce que la personne a accepté.',
        privacyConsentPurpose:
          'Ce pour quoi ce consentement est demandé, tel que décrit dans les informations sur la protection des données. Pour la newsletter, les inscriptions qui acceptent peuvent être importées dans une newsletter.',
        privacyConsentFor:
          'Les données sensibles couvertes par ce consentement. Les réponses aux questions de ces catégories le requièrent.',
        showPaymentTotal:
          "Quand le formulaire affiche le montant total sur sa dernière page, au-dessus du bouton d'envoi. " +
          "Si non nul : seulement si l'inscription coûte quelque chose. " +
          'Toujours : aussi 0,00 pour une inscription gratuite. ' +
          'Jamais : pour un événement payant, seulement si le formulaire indique le prix ailleurs.',
        eventDataType:
          'Sélectionnez le type de données que l’utilisateur saisit. ' +
          'Les informations sont mises à la disposition du service indépendamment du nom du champ. ' +
          '« Modifie le prix » donne un prix aux réponses.',
        price:
          "Ajouté au prix de l'événement tant que cette réponse est choisie et affichée. Un montant négatif est une réduction.",
        groupCountryMatch:
          'Comment le pays se rapporte au groupe choisi. ' +
          'Strict : le pays du groupe, non modifiable. ' +
          'Avertir : prérempli et modifiable, avec un avis en cas de différence. ' +
          'Libre : sans valeur par défaut. Sur une adresse, s’applique à son pays.',
      },
      pv: {
        privacyCategory: privacyFr.dataCategory,
        privacyConsentPurpose: privacyFr.purpose,
        privacyConsentFor: privacyFr.dataCategory,
        eventDataType: {
          first_name: 'Prénom',
          last_name: 'Nom de famille',
          name: 'Nom',
          email: 'E-mail (contact)',
          phone: 'Numéro de téléphone (contact)',
          address: 'Adresse',
          street: 'Rue & numéro',
          zip_code: 'Code postal',
          city: 'Ville',
          country: 'Pays',
          date_of_birth: 'Date de naissance',
          gender: 'Sexe',
          role: 'Rôle',
          payment_amount: 'Modifie le prix',
        },
        showPaymentTotal: {
          nonZero: 'Si non nul',
          always: 'Toujours',
          never: 'Jamais',
        },
        groupCountryMatch: {
          strict: 'Strict – pays du groupe',
          warn: 'Avertir en cas de différence',
          free: 'Libre',
        },
      },
    },

    pl: {
      qt: {
        address: 'Adres',
        country: 'Kraj',
        date_of_birth: 'Data urodzenia',
        role: 'Rola',
      },
      toolboxCategories: {
        registration: 'Rejestracja',
      },
      pe: { tabs: { registration: 'Zgłoszenie' } },
      p: {
        privacyCategory: 'Kategoria danych osobowych',
        privacyConsent: 'Zgoda',
        privacyConsentPurpose: 'Cel zgody',
        privacyConsentFor: 'Odblokowuje dane wrażliwe',
        eventDataType: 'Tag danych',
        groupCountryMatch: 'Zgodność z grupą',
        price: 'Cena',
        showPaymentTotal: 'Kwota całkowita',
      },
      pehelp: {
        privacyCategory:
          'Jakiego rodzaju dane osobowe zbiera to pytanie, zgodnie z informacjami o ochronie danych. Pytania o zdrowie, alergie, leki, niepełnosprawność lub religię wymagają podstawy prawnej, zwykle pytania o zgodę. Tylko oznaczone tu pytania są traktowane jako wrażliwe – platforma sama nie wykrywa danych wrażliwych. Sprawdź też pola tekstowe.',
        privacyConsent:
          'To pytanie prosi o zgodę. Jego treść jest zapisywana przy każdym zgłoszeniu jako dowód tego, na co dana osoba się zgodziła.',
        privacyConsentPurpose:
          'W jakim celu prosisz o tę zgodę, zgodnie z informacjami o ochronie danych. W przypadku newslettera zgłoszenia, które wyrażą zgodę, można zaimportować do newslettera.',
        privacyConsentFor:
          'Dane wrażliwe, których dotyczy ta zgoda. Odpowiedzi na pytania z tych kategorii jej wymagają.',
        showPaymentTotal:
          'Kiedy formularz pokazuje kwotę całkowitą na ostatniej stronie, nad przyciskiem wysyłania. ' +
          'Gdy niezerowa: tylko jeśli rejestracja coś kosztuje. ' +
          'Zawsze: także 0,00 przy bezpłatnej rejestracji. ' +
          'Nigdy: przy płatnym wydarzeniu tylko wtedy, gdy formularz podaje cenę w innym miejscu.',
        eventDataType:
          'Wybierz, jaki typ danych wprowadza użytkownik. ' +
          'Informacje są przekazywane do usługi niezależnie od nazwy pola. ' +
          '„Wpływa na cenę” nadaje odpowiedziom cenę.',
        price:
          'Dodawana do ceny wydarzenia, dopóki ta odpowiedź jest wybrana i widoczna. Kwota ujemna oznacza zniżkę.',
        groupCountryMatch:
          'Jak kraj odnosi się do wybranej grupy. ' +
          'Ścisły: kraj grupy, bez możliwości zmiany. ' +
          'Ostrzeżenie: wstępnie wypełniony i edytowalny, z informacją przy różnicy. ' +
          'Dowolny: bez wartości domyślnej. W adresie dotyczy jej kraju.',
      },
      pv: {
        privacyCategory: privacyPl.dataCategory,
        privacyConsentPurpose: privacyPl.purpose,
        privacyConsentFor: privacyPl.dataCategory,
        eventDataType: {
          first_name: 'Imię',
          last_name: 'Nazwisko',
          name: 'Imię i nazwisko',
          email: 'E-mail (kontakt)',
          phone: 'Numer telefonu (kontakt)',
          address: 'Adres',
          street: 'Ulica i numer domu',
          zip_code: 'Kod pocztowy',
          city: 'Miejscowość',
          country: 'Kraj',
          date_of_birth: 'Data urodzenia',
          gender: 'Płeć',
          role: 'Rola',
          payment_amount: 'Wpływa na cenę',
        },
        showPaymentTotal: {
          nonZero: 'Gdy niezerowa',
          always: 'Zawsze',
          never: 'Nigdy',
        },
        groupCountryMatch: {
          strict: 'Ścisły – kraj grupy',
          warn: 'Ostrzegaj przy różnicy',
          free: 'Dowolny',
        },
      },
    },

    cs: {
      qt: {
        address: 'Adresa',
        country: 'Země',
        date_of_birth: 'Datum narození',
        role: 'Role',
      },
      toolboxCategories: {
        registration: 'Registrace',
      },
      pe: { tabs: { registration: 'Přihláška' } },
      p: {
        privacyCategory: 'Kategorie osobních údajů',
        privacyConsent: 'Souhlas',
        privacyConsentPurpose: 'Účel souhlasu',
        privacyConsentFor: 'Odemyká citlivé údaje',
        eventDataType: 'Datový štítek',
        groupCountryMatch: 'Shoda se skupinou',
        price: 'Cena',
        showPaymentTotal: 'Celková částka',
      },
      pehelp: {
        privacyCategory:
          'Jaký druh osobních údajů tato otázka shromažďuje, jak je uvedeno v informacích o ochraně údajů. Otázky na zdraví, alergie, léky, zdravotní postižení nebo náboženství potřebují právní základ, obvykle otázku na souhlas. Jako citlivé se zachází jen s takto označenými otázkami – platforma citlivé údaje sama nerozpozná. Zkontroluj i pole pro volný text.',
        privacyConsent:
          'Tato otázka žádá o souhlas. Její znění se ukládá ke každé přihlášce jako doklad, s čím osoba souhlasila.',
        privacyConsentPurpose:
          'K čemu se tento souhlas vyžaduje, jak je uvedeno v informacích o ochraně osobních údajů. U newsletteru lze přihlášky, které souhlasí, importovat do newsletteru.',
        privacyConsentFor:
          'Citlivé údaje, na které se tento souhlas vztahuje. Odpovědi na otázky s těmito kategoriemi ho vyžadují.',
        showPaymentTotal:
          'Kdy formulář ukazuje celkovou částku na poslední stránce nad tlačítkem odeslání. ' +
          'Když není nulová: jen pokud registrace něco stojí. ' +
          'Vždy: i 0,00 u bezplatné registrace. ' +
          'Nikdy: u placené akce jen tehdy, když formulář uvádí cenu jinde.',
        eventDataType:
          'Vyberte, jaký typ dat uživatel zadává. ' +
          'Informace jsou službě k dispozici nezávisle na názvu pole. ' +
          '„Ovlivňuje cenu“ dává odpovědím cenu.',
        price:
          'Připočítá se k ceně akce, dokud je tato odpověď vybraná a zobrazená. Záporná částka je sleva.',
        groupCountryMatch:
          'Jak se země vztahuje ke zvolené skupině. ' +
          'Přísný: země skupiny, nelze změnit. ' +
          'Upozornit: předvyplněno a upravitelné, s upozorněním při rozdílu. ' +
          'Volný: bez výchozí hodnoty. U adresy platí pro její zemi.',
      },
      pv: {
        privacyCategory: privacyCs.dataCategory,
        privacyConsentPurpose: privacyCs.purpose,
        privacyConsentFor: privacyCs.dataCategory,
        eventDataType: {
          first_name: 'Jméno',
          last_name: 'Příjmení',
          name: 'Celé jméno',
          email: 'E-mail (kontakt)',
          phone: 'Telefonní číslo (kontakt)',
          address: 'Adresa',
          street: 'Ulice a číslo domu',
          zip_code: 'PSČ',
          city: 'Obec',
          country: 'Země',
          date_of_birth: 'Datum narození',
          gender: 'Pohlaví',
          role: 'Role',
          payment_amount: 'Ovlivňuje cenu',
        },
        showPaymentTotal: {
          nonZero: 'Když není nulová',
          always: 'Vždy',
          never: 'Nikdy',
        },
        groupCountryMatch: {
          strict: 'Přísný – země skupiny',
          warn: 'Upozornit při rozdílu',
          free: 'Volný',
        },
      },
    },
  };
