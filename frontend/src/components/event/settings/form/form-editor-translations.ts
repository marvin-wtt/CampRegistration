type QtKey = 'address' | 'country' | 'date_of_birth' | 'role';

type LocaleSection = {
  qt: Record<QtKey, string>;
  p: { eventDataType: string };
  pehelp: { eventDataType: string };
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
      p: {
        eventDataType: 'Daten-Tag',
      },
      pehelp: {
        eventDataType:
          'Wählen Sie aus, welche Art von Daten der Benutzer eingibt. ' +
          'Die Informationen werden dem Dienst unabhängig vom Feldnamen zur Verfügung gestellt.',
      },
    },

    en: {
      qt: {
        address: 'Address',
        country: 'Country',
        date_of_birth: 'Birthday',
        role: 'Role',
      },
      p: {
        eventDataType: 'Data Tag',
      },
      pehelp: {
        eventDataType:
          'Select what type of data the user enters. ' +
          'The information is made available to the service regardless of the field name.',
      },
    },
    fr: {
      qt: {
        address: 'Adresse',
        country: 'Pays',
        date_of_birth: 'Date de naissance',
        role: 'Rôle',
      },
      p: {
        eventDataType: 'Étiquette de données',
      },
      pehelp: {
        eventDataType:
          'Sélectionnez le type de données que l’utilisateur saisit. ' +
          'Les informations sont mises à la disposition du service indépendamment du nom du champ.',
      },
    },

    pl: {
      qt: {
        address: 'Adres',
        country: 'Kraj',
        date_of_birth: 'Data urodzenia',
        role: 'Rola',
      },
      p: {
        eventDataType: 'Tag danych',
      },
      pehelp: {
        eventDataType:
          'Wybierz, jaki typ danych wprowadza użytkownik. ' +
          'Informacje są przekazywane do usługi niezależnie od nazwy pola.',
      },
    },

    cs: {
      qt: {
        address: 'Adresa',
        country: 'Země',
        date_of_birth: 'Datum narození',
        role: 'Role',
      },
      p: {
        eventDataType: 'Datový štítek',
      },
      pehelp: {
        eventDataType:
          'Vyberte, jaký typ dat uživatel zadává. ' +
          'Informace jsou službě k dispozici nezávisle na názvu pole.',
      },
    },
  };
