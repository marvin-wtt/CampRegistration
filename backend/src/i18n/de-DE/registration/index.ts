export default {
  email: {
    reason:
      '$t(email:footer.cause) Sie sich für diese Veranstaltung angemeldet haben.',
    privacyLink: 'Datenschutzinformationen zu dieser Veranstaltung',
    changes: {
      cleared: 'entfernt',
      file: 'Datei aktualisiert',
    },
    managerNotification: {
      subject: 'Neue Anmeldung | {{ event.name }}',
      preview: 'Neue Anmeldung für die Veranstaltung: {{ event.name }}',
      text: {
        title: 'Hallo,',
        information:
          '{{ registration.firstName }} {{ registration.lastName }} hat sich für {{ event.name }} angemeldet.',
        button: 'Anmeldungen anzeigen',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause:
          '$t(email:footer.cause) Sie eine Kontaktperson für diese Veranstaltung sind.',
      },
    },
  },
};
