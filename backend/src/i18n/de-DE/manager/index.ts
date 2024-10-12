export default {
  email: {
    invitation: {
      subject: 'Camp-Einladung',
      preview: 'Du wurdest eingeladen, {{ camp.name }} zu verwalten',
      text: {
        title: 'Hallo,',
        information:
          'Du wurdest eingeladen, {{ camp.name }} zu verwalten. ' +
          'Wenn du bereits ein Konto hast, wird das Camp automatisch verfügbar sein. ' +
          'Andernfalls erstelle bitte zuerst ein kostenloses Konto.',
        button: 'Camp verwalten',
        greeting: 'Viele Grüße,',
        teamName: '$t(appName) Team',
      },
      footer: {
        cause:
          '$t(email:footer.cause) du von einem anderen Benutzer eingeladen wurdest.',
      },
    },
  },
};
