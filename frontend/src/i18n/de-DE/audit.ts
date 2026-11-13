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
        payoutNumberPrefix: 'Präfix der Auszahlungsnummern',
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
        group: 'Gruppe',
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
          DIRECTOR: 'Leitung',
          COORDINATOR: 'Koordination',
          TREASURER: 'Kasse',
          COUNSELOR: 'Betreuung',
          VIEWER: 'Lesezugriff',
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
    expense: {
      label: 'Ausgabe',
      fields: {
        type: 'Art',
        amount: 'Betrag',
        originalAmount: 'Ursprünglicher Betrag',
        originalCurrency: 'Ursprüngliche Währung',
        date: 'Datum',
        description: 'Beschreibung',
        categoryId: 'Kategorie',
        paidByUserId: 'Bezahlt von',
        paidByName: 'Bezahlt von (Name)',
        files: 'Belegdateien',
        receiptNumber: 'Belegnummer',
      },
      values: {
        type: {
          EXPENSE: 'Ausgabe',
          REFUND: 'Erstattung',
        },
      },
    },
    expenseCategory: {
      label: 'Ausgabenkategorie',
      fields: {
        name: 'Name',
        parentId: 'Gruppe',
        position: 'Position',
        archivedAt: 'Archiviert',
      },
    },
    payout: {
      label: 'Auszahlung',
      actions: {
        signed: 'Unterschrieben',
        unsigned: 'Unterschrift entfernt',
      },
      fields: {
        recipientUserId: 'Empfänger:in',
        recipientName: 'Empfänger:in (Name)',
        direction: 'Richtung',
        amount: 'Betrag',
        note: 'Notiz',
        number: 'Nummer',
        paidOn: 'Bezahlt am',
        signedAt: 'Unterschrieben',
      },
      values: {
        direction: {
          OUT: 'Ausgezahlt',
          IN: 'Zurückgezahlt',
        },
      },
    },
    messageTemplate: {
      label: 'Automatische E-Mail',
      fields: {
        trigger: 'Auslöser',
        group: 'Gruppe',
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
