export default {
  email: {
    managerNotification: {
      subject: 'Anmeldebenachrichtigung',
      preview: 'Neue Anmeldung für das Camp: {{ camp.name }}',
      text: {
        title: 'Hallo,',
        information:
          '{{ registration.fullName }} hat sich für {{ camp.name }} angemeldet.',
        button: 'Anmeldungen anzeigen',
        greeting: 'Viele Grüße',
        teamName: '$t(appName) Team',
      },
      footer: {
        cause:
          '$t(email:footer.cause) Sie eine Kontaktperson für dieses Camps sind.',
      },
    },
  },
};
