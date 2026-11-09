import type {
  PaymentTotalMode,
  GroupCountryMatch,
} from '@camp-registration/common/form';

type QtKey = 'address' | 'country' | 'date_of_birth' | 'role';
type PropertyKey =
  'showPaymentTotal' | 'eventDataType' | 'groupCountryMatch' | 'price';

type LocaleSection = {
  qt: Record<QtKey, string>;
  toolboxCategories: { registration: string };
  p: Record<PropertyKey, string>;
  pehelp: Record<PropertyKey, string>;
  // Property values, looked up by the creator as `pv.<property>.<value>`.
  pv: {
    showPaymentTotal: Record<PaymentTotalMode, string>;
    groupCountryMatch: Record<GroupCountryMatch, string>;
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
      p: {
        eventDataType: 'Daten-Tag',
        groupCountryMatch: 'Abgleich mit der Gruppe',
        price: 'Preis',
        showPaymentTotal: 'Gesamtbetrag',
      },
      pehelp: {
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
      p: {
        eventDataType: 'Data Tag',
        groupCountryMatch: 'Match with group',
        price: 'Price',
        showPaymentTotal: 'Total amount',
      },
      pehelp: {
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
      p: {
        eventDataType: 'Étiquette de données',
        groupCountryMatch: 'Correspondance avec le groupe',
        price: 'Prix',
        showPaymentTotal: 'Montant total',
      },
      pehelp: {
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
      p: {
        eventDataType: 'Tag danych',
        groupCountryMatch: 'Zgodność z grupą',
        price: 'Cena',
        showPaymentTotal: 'Kwota całkowita',
      },
      pehelp: {
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
      p: {
        eventDataType: 'Datový štítek',
        groupCountryMatch: 'Shoda se skupinou',
        price: 'Cena',
        showPaymentTotal: 'Celková částka',
      },
      pehelp: {
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
