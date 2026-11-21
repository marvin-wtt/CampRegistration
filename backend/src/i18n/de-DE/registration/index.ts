export default {
  email: {
    reason:
      '$t(email:footer.cause) du dich für diese Veranstaltung angemeldet hast.',
    privacyLink: 'Datenschutzinformationen zu dieser Veranstaltung',
    changes: {
      cleared: 'entfernt',
      file: 'Datei aktualisiert',
    },
    managerNotification: {
      subject: 'Neue Anmeldung | {{ event.name }}',
      preview: 'Neue Anmeldung für {{ event.name }}',
      text: {
        title: 'Neue Anmeldung',
        information:
          '{{ registration.firstName }} {{ registration.lastName }} hat sich gerade für {{ event.name }} angemeldet.',
        button: 'Anmeldungen anzeigen',
      },
      footer: {
        cause:
          '$t(email:footer.cause) du Kontaktperson für diese Veranstaltung bist.',
      },
    },
    messageBounced: {
      subject: 'Nachricht nicht zugestellt | {{ event.name }}',
      preview:
        'Eine Nachricht an {{ recipient }} konnte für {{ event.name }} nicht zugestellt werden',
      text: {
        title: 'Deine Nachricht wurde nicht zugestellt',
        information:
          '„{{ messageSubject }}“ an {{ recipient }} für {{ event.name }} konnte nicht zugestellt werden. Prüfe am besten die E-Mail-Adresse dieser Anmeldung.',
        button: 'Anmeldungen anzeigen',
      },
      footer: {
        cause:
          '$t(email:footer.cause) du Kontaktperson für diese Veranstaltung bist.',
      },
    },
  },
};
