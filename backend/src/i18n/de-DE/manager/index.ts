export default {
  email: {
    invitation: {
      subject: 'Veranstaltungseinladung',
      preview: 'Du wurdest eingeladen, {{ event.name }} zu verwalten',
      text: {
        title: 'Hallo,',
        information:
          'Du wurdest eingeladen, {{ event.name }} zu verwalten. ' +
          'Wenn du bereits ein Konto hast, wird die Veranstaltung automatisch verfügbar sein. ' +
          'Andernfalls erstelle bitte zuerst ein kostenloses Konto.',
        button: 'Veranstaltung verwalten',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause:
          '$t(email:footer.cause) du von einem anderen Benutzer eingeladen wurdest.',
      },
    },
  },
};
