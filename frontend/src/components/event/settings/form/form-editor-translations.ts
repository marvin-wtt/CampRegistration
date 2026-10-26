import type { GroupCountryMatch } from '@camp-registration/common/form';

type QtKey = 'address' | 'country' | 'date_of_birth' | 'role';

type LocaleSection = {
  qt: Record<QtKey, string>;
  toolboxCategories: { registration: string };
  p: { eventDataType: string; groupCountryMatch: string; price: string };
  pehelp: { eventDataType: string; groupCountryMatch: string; price: string };
  // Property values, looked up by the creator as `pv.<property>.<value>`.
  pv: { groupCountryMatch: Record<GroupCountryMatch, string> };
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
      },
      pehelp: {
        eventDataType:
          'Wähle aus, welche Art von Daten die Person eingibt. ' +
          'Die Informationen werden dem Dienst unabhängig vom Feldnamen zur Verfügung gestellt.',
        price:
          'Wird zum Preis der Veranstaltung addiert, solange die Antwort gewählt und sichtbar ist. Ein negativer Betrag ist ein Rabatt.',
        groupCountryMatch:
          'Wie sich das Land zur gewählten Gruppe verhält. ' +
          'Streng: das Land der Gruppe, nicht änderbar. ' +
          'Warnen: vorausgefüllt und änderbar, mit Hinweis bei Abweichung. ' +
          'Frei: ohne Vorgabe. Bei einer Adresse gilt es für ihr Land.',
      },
      pv: {
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
      },
      pehelp: {
        eventDataType:
          'Select what type of data the user enters. ' +
          'The information is made available to the service regardless of the field name.',
        price:
          'Added to the event price while this answer is selected and shown. A negative amount is a discount.',
        groupCountryMatch:
          'How the country relates to the chosen group. ' +
          "Strict: the group's country, read-only. " +
          'Warn: prefilled and editable, with a notice when it differs. ' +
          'Free: no default. On an address, applies to its country.',
      },
      pv: {
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
      },
      pehelp: {
        eventDataType:
          'Sélectionnez le type de données que l’utilisateur saisit. ' +
          'Les informations sont mises à la disposition du service indépendamment du nom du champ.',
        price:
          "Ajouté au prix de l'événement tant que cette réponse est choisie et affichée. Un montant négatif est une réduction.",
        groupCountryMatch:
          'Comment le pays se rapporte au groupe choisi. ' +
          'Strict : le pays du groupe, non modifiable. ' +
          'Avertir : prérempli et modifiable, avec un avis en cas de différence. ' +
          'Libre : sans valeur par défaut. Sur une adresse, s’applique à son pays.',
      },
      pv: {
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
      },
      pehelp: {
        eventDataType:
          'Wybierz, jaki typ danych wprowadza użytkownik. ' +
          'Informacje są przekazywane do usługi niezależnie od nazwy pola.',
        price:
          'Dodawana do ceny wydarzenia, dopóki ta odpowiedź jest wybrana i widoczna. Kwota ujemna oznacza zniżkę.',
        groupCountryMatch:
          'Jak kraj odnosi się do wybranej grupy. ' +
          'Ścisły: kraj grupy, bez możliwości zmiany. ' +
          'Ostrzeżenie: wstępnie wypełniony i edytowalny, z informacją przy różnicy. ' +
          'Dowolny: bez wartości domyślnej. W adresie dotyczy jej kraju.',
      },
      pv: {
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
      },
      pehelp: {
        eventDataType:
          'Vyberte, jaký typ dat uživatel zadává. ' +
          'Informace jsou službě k dispozici nezávisle na názvu pole.',
        price:
          'Připočítá se k ceně akce, dokud je tato odpověď vybraná a zobrazená. Záporná částka je sleva.',
        groupCountryMatch:
          'Jak se země vztahuje ke zvolené skupině. ' +
          'Přísný: země skupiny, nelze změnit. ' +
          'Upozornit: předvyplněno a upravitelné, s upozorněním při rozdílu. ' +
          'Volný: bez výchozí hodnoty. U adresy platí pro její zemi.',
      },
      pv: {
        groupCountryMatch: {
          strict: 'Přísný – země skupiny',
          warn: 'Upozornit při rozdílu',
          free: 'Volný',
        },
      },
    },
  };
