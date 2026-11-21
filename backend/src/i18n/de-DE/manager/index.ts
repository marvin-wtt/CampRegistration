export default {
  email: {
    invitation: {
      subject: 'Du wurdest eingeladen, eine Veranstaltung zu verwalten',
      preview: 'Hilf mit, {{ event.name }} zu verwalten',
      text: {
        title: 'Du wurdest zu {{ event.name }} eingeladen',
        information:
          'Wenn du schon ein Konto hast, wartet die Veranstaltung bereits auf dich. ' +
          'Andernfalls erstelle zuerst ein kostenloses Konto.',
        button: 'Veranstaltung öffnen',
      },
      footer: {
        cause:
          '$t(email:footer.cause) du von einem anderen Benutzer eingeladen wurdest.',
      },
    },
  },
};
