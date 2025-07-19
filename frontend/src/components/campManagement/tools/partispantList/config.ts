import type { FileConfig } from 'components/campManagement/tools/partispantList/FGYOParticipationList';

export const participantListConfig: Record<string, FileConfig> = {
  de: {
    file: 'liste-der-teilnehmenden.pdf',
    fields: {
      participants: {
        lastName: (i) => `Name${i + 1}`,
        firstName: (i) => `Vorname${i + 1}`,
        zipCode: (i) => `Postleit zahl${i + 1}`,
        city: (i) => `Ort${i + 1}`,
        country: (i) => `Land${i + 1}`,
        age: (i) => `Alter${i + 1}`,
        nights: (i) => `Anzahl der Nächte${i + 1}`,
        distance: (i) => `km-${i < 9 ? 0 : ''}${i + 1}`,
        count: 45,
      },
      counselors: {
        lastName: (i) => `Name${i + 1}_2`,
        firstName: (i) => `Vorname${i + 1}_2`,
        zipCode: (i) => `Postleit zahl${i + 1}_2`,
        city: (i) => `Ort${i + 1}_2`,
        country: (i) => `Land${i + 1}_2`,
        age: (i) => `Alter${i + 1}_2`,
        role: {
          field: (i) => `dropdown-4-${i < 9 ? 0 : ''}${i + 1}`,
          values: {
            counselor: 'Teamer:in',
            referent: 'Referent:in',
            interpreter: 'Dolmetscher:in',
            companion: 'Begleitperson',
            instructor: 'Fortbilder:in',
            trainee:
              'Praktikant:in (Grundausbildung für interkulturelle Jugendleiter:innen)',
          },
        },
        nights: (i) => `Anzahl der Nächte${i + 1}_2`,
        distance: (i) => `km-${i < 9 ? 0 : ''}${i + 1}`,
        count: 8,
      },
      general: {
        country: {
          field: 'Groupe4',
          values: {
            de: 'Choix1',
            fr: 'Choix2',
            other: 'Choix3',
          },
        },
        otherCountry: 'weiteres Land',
        date: 'Datum-Seite4',
        reference: 'Aktenzeichen DFJW',
        responsiblePerson: 'Name der für das Projekt verantwortlichen Person',
      },
    },
  },
  fr: {
    file: 'liste-des-participantes-et-participants.pdf',
    fields: {
      participants: {
        lastName: (i) => `Name${i + 1}`,
        firstName: (i) => `Vorname${i + 1}`,
        zipCode: (i) => `Postleit zahl${i + 1}`,
        city: (i) => `Ort${i + 1}`,
        country: (i) => `Land${i + 1}`,
        age: (i) => `Alter${i + 1}`,
        nights: (i) => `Anzahl der Nächte${i + 1}`,
        distance: (i) => `km-${i < 9 ? 0 : ''}${i + 1}`,
        count: 45,
      },
      counselors: {
        lastName: (i) => `Name${i + 1}_2`,
        firstName: (i) => `Vorname${i + 1}_2`,
        zipCode: (i) => `Postleit zahl${i + 1}_2`,
        city: (i) => `Ort${i + 1}_2`,
        country: (i) => `Land${i + 1}_2`,
        age: (i) => `Alter${i + 1}_2`,
        role: {
          field: (i) => `dropdown-4-${i < 9 ? 0 : ''}${i + 1}`,
          values: {
            counselor: 'Animatrice ou animateur',
            referent: 'Intervenante ou intervenant',
            interpreter: 'Interprète',
            companion: 'Personne encadrante',
            instructor: 'Formatrice ou formateur',
            trainee:
              "Stagiaire (formation de base à l'animation interculturelle)",
          },
        },
        nights: (i) => `Anzahl der Nächte${i + 1}_2`,
        distance: (i) => `km-${i < 9 ? 0 : ''}${i + 1}`,
        count: 8,
      },
      general: {
        country: {
          field: 'Groupe4',
          values: {
            de: 'Choix2',
            fr: 'Choix1',
            other: 'Choix3',
          },
        },
        otherCountry: 'weiteres Land',
        date: 'Datum-Seite4',
        reference: 'Aktenzeichen DFJW',
        responsiblePerson: 'Name der für das Projekt verantwortlichen Person',
      },
    },
  },
};
