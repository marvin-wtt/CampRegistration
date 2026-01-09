type QtKey = 'address' | 'country' | 'date_of_birth' | 'role';

type LocaleSection = {
  qt: Record<QtKey, string>;
  p: { campDataType: string };
  pehelp: { campDataType: string };
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
        campDataType: 'Daten-Tag',
      },
      pehelp: {
        campDataType:
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
        campDataType: 'Data Tag',
      },
      pehelp: {
        campDataType:
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
        campDataType: 'Étiquette de données',
      },
      pehelp: {
        campDataType:
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
        campDataType: 'Tag danych',
      },
      pehelp: {
        campDataType:
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
        campDataType: 'Datový štítek',
      },
      pehelp: {
        campDataType:
          'Vyberte, jaký typ dat uživatel zadává. ' +
          'Informace jsou službě k dispozici nezávisle na názvu pole.',
      },
    },
  };
