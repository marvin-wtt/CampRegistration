export default {
  email: {
    reviewPending: {
      subject: 'Organisation wartet auf Prüfung: {{ organization.name }}',
      preview: '{{ organization.name }} wartet auf die Verifizierung',
      text: {
        title: 'Neue Organisation zu prüfen',
        information:
          '{{ organization.name }} wartet auf die Verifizierung. ' +
          'Bis dahin kann sie keine Veranstaltungen veröffentlichen und keine Newsletter versenden.',
        button: 'Organisation prüfen',
      },
      footer: {
        cause: '$t(email:footer.cause) du Administrator bist.',
      },
    },
    verified: {
      subject: 'Deine Organisation ist verifiziert',
      preview:
        '{{ organization.name }} kann jetzt Veranstaltungen veröffentlichen',
      text: {
        title: '{{ organization.name }} ist verifiziert',
        information:
          'Gute Nachrichten: Du kannst jetzt Veranstaltungen veröffentlichen und Newsletter versenden.',
        button: 'Organisation öffnen',
      },
      footer: {
        cause: '$t(email:footer.cause) du diese Organisation verwaltest.',
      },
    },
    rejected: {
      subject: 'Deine Organisation konnte nicht verifiziert werden',
      preview: '{{ organization.name }} braucht deine Aufmerksamkeit',
      text: {
        title: 'Wir konnten {{ organization.name }} nicht verifizieren',
        information:
          'Bis zur Verifizierung kann sie keine Veranstaltungen veröffentlichen und keine Newsletter versenden. ' +
          'Aktualisiere ihre Angaben und wir prüfen sie erneut.',
        reasonLabel: 'Grund',
        button: 'Angaben aktualisieren',
      },
      footer: {
        cause: '$t(email:footer.cause) du diese Organisation verwaltest.',
      },
    },
  },
};
