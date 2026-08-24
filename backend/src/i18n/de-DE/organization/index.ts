export default {
  email: {
    reviewPending: {
      subject: 'Organisation wartet auf Prüfung: {{ organization.name }}',
      preview: '{{ organization.name }} wartet auf die Verifizierung',
      text: {
        title: 'Eine neue Organisation muss geprüft werden',
        information:
          '{{ organization.name }} wurde zur Verifizierung eingereicht. ' +
          'Bis zur Verifizierung kann sie keine Veranstaltungen veröffentlichen und keine Newsletter versenden.',
        button: 'Organisationen prüfen',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause: '$t(email:footer.cause) du Administrator bist.',
      },
    },
    verified: {
      subject: 'Deine Organisation wurde verifiziert',
      preview:
        '{{ organization.name }} kann jetzt Veranstaltungen veröffentlichen',
      text: {
        title: 'Deine Organisation wurde verifiziert',
        information:
          '{{ organization.name }} wurde verifiziert. ' +
          'Du kannst jetzt ihre Veranstaltungen veröffentlichen und Newsletter versenden.',
        button: 'Organisation öffnen',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause: '$t(email:footer.cause) du diese Organisation verwaltest.',
      },
    },
    rejected: {
      subject: 'Deine Organisation konnte nicht verifiziert werden',
      preview: '{{ organization.name }} benötigt deine Aufmerksamkeit',
      text: {
        title: 'Deine Organisation konnte nicht verifiziert werden',
        information:
          '{{ organization.name }} wurde nicht verifiziert. ' +
          'Bis dahin kann sie keine Veranstaltungen veröffentlichen und keine Newsletter versenden. ' +
          'Wenn du die registrierten Angaben korrigierst, wird sie erneut geprüft.',
        reasonLabel: 'Grund',
        button: 'Angaben prüfen',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause: '$t(email:footer.cause) du diese Organisation verwaltest.',
      },
    },
  },
};
