export default {
  actions: {
    created: 'Erstellt',
    updated: 'Aktualisiert',
    deleted: 'Gelöscht',
  },
  reason: 'Grund',
  deletedUser: 'Gelöschter Benutzer',
  today: 'Heute',
  yesterday: 'Gestern',
  viewInSettings: 'In den Einstellungen ansehen',
  entities: {
    event: {
      label: 'Veranstaltung',
      fields: {
        organizationId: 'Organisation',
        listed: 'Veranstaltung auf Startseite anzeigen',
        registrationOpensAt: 'Anmeldung öffnet am',
        registrationClosesAt: 'Anmeldung schließt am',
        confirmationMode: 'Bestätigungsmodus',
        countries: 'Länder',
        name: 'Name',
        organizer: 'Veranstalter',
        contactEmail: 'Kontakt-E-Mail',
        maxParticipants: 'Maximale Teilnehmerzahl',
        minAge: 'Mindestalter',
        maxAge: 'Höchstalter',
        startAt: 'Startdatum',
        endAt: 'Enddatum',
        price: 'Preis',
        location: 'Ort',
        timezone: 'Zeitzone',
        form: 'Anmeldeformular',
      },
    },
    registration: {
      label: 'Anmeldung',
      fields: {
        data: 'Formularantwort',
        customData: 'Benutzerdefiniertes Feld',
        customFiles: 'Benutzerdefinierte Datei',
        status: 'Status',
        country: 'Land',
      },
      values: {
        status: {
          ACCEPTED: 'Akzeptiert',
          PENDING: 'Ausstehend',
          WAITLISTED: 'Warteliste',
        },
      },
      reasons: {
        canceled: 'Storniert',
        declined: 'Abgelehnt',
        duplicate: 'Duplikat',
        test_entry: 'Testeintrag',
        other: 'Sonstiges',
      },
      deleted: 'Gelöschte Anmeldung',
      view: 'Anmeldung ansehen',
      gone: 'Diese Anmeldung existiert nicht mehr',
    },
    eventManager: {
      label: 'Zugriff',
      reasons: {
        account_deleted: 'Konto gelöscht',
      },
      fields: {
        role: 'Rolle',
        expiresAt: 'Läuft ab am',
      },
      values: {
        role: {
          DIRECTOR: 'Leiter',
          COORDINATOR: 'Koordinator',
          COUNSELOR: 'Betreuer',
          VIEWER: 'Betrachter',
        },
      },
    },
    message: {
      label: 'Nachricht',
      fields: {
        recipients: 'Empfänger',
      },
      actions: {
        sent: 'Gesendet',
      },
      view: 'Nachricht ansehen',
      gone: 'Diese Nachricht existiert nicht mehr',
    },
    messageTemplate: {
      label: 'Automatische E-Mail',
      fields: {
        trigger: 'Auslöser',
        country: 'Land',
        subject: 'Betreff',
        body: 'Inhalt',
        priority: 'Priorität',
        replyTo: 'Antwortadresse',
        attachments: 'Anhänge',
      },
      values: {
        trigger: {
          registration_submitted: 'Anmeldung eingereicht',
          registration_confirmed: 'Anmeldung bestätigt',
          registration_waitlisted: 'Anmeldung auf Warteliste',
          registration_waitlist_accepted: 'Wartelistenanmeldung akzeptiert',
          registration_updated: 'Anmeldung aktualisiert',
          registration_canceled: 'Anmeldung storniert',
        },
      },
    },
  },
};
