export default {
  actions: {
    created: 'Utworzono',
    updated: 'Zaktualizowano',
    deleted: 'Usunięto',
  },
  reason: 'Powód',
  deletedUser: 'Usunięty użytkownik',
  today: 'Dzisiaj',
  yesterday: 'Wczoraj',
  viewInSettings: 'Zobacz w ustawieniach',
  entities: {
    event: {
      label: 'Wydarzenie',
      fields: {
        organizationId: 'Organizacja',
        listed: 'Pokaż wydarzenie na stronie głównej',
        registrationOpensAt: 'Rejestracja otwiera się',
        registrationClosesAt: 'Rejestracja zamyka się',
        confirmationMode: 'Tryb potwierdzenia',
        countries: 'Kraje',
        name: 'Nazwa',
        organizer: 'Organizator',
        contactEmail: 'E-mail kontaktowy',
        maxParticipants: 'Maksymalna liczba uczestników',
        minAge: 'Minimalny wiek',
        maxAge: 'Maksymalny wiek',
        startAt: 'Data rozpoczęcia',
        endAt: 'Data zakończenia',
        price: 'Cena',
        location: 'Lokalizacja',
        timezone: 'Strefa czasowa',
        form: 'Formularz rejestracyjny',
      },
    },
    registration: {
      label: 'Zgłoszenie',
      fields: {
        data: 'Odpowiedź z formularza',
        customData: 'Pole niestandardowe',
        customFiles: 'Plik niestandardowy',
        status: 'Status',
        country: 'Kraj',
      },
      values: {
        status: {
          ACCEPTED: 'Zaakceptowano',
          PENDING: 'Oczekuje',
          WAITLISTED: 'Lista oczekujących',
        },
      },
      reasons: {
        canceled: 'Anulowane',
        declined: 'Odrzucone',
        duplicate: 'Duplikat',
        test_entry: 'Wpis testowy',
        other: 'Inne',
      },
      deleted: 'Usunięte zgłoszenie',
      view: 'Zobacz zgłoszenie',
      gone: 'To zgłoszenie już nie istnieje',
    },
    eventManager: {
      label: 'Dostęp',
      reasons: {
        account_deleted: 'Konto usunięte',
      },
      fields: {
        role: 'Rola',
        expiresAt: 'Wygasa',
      },
      values: {
        role: {
          DIRECTOR: 'Kierownik',
          COORDINATOR: 'Koordynator',
          COUNSELOR: 'Opiekun',
          VIEWER: 'Podglądający',
        },
      },
    },
    message: {
      label: 'Wiadomość',
      fields: {
        recipients: 'Odbiorcy',
      },
      actions: {
        sent: 'Wysłano',
      },
      view: 'Zobacz wiadomość',
      gone: 'Ta wiadomość już nie istnieje',
    },
    messageTemplate: {
      label: 'Automatyczny e-mail',
      fields: {
        trigger: 'Wyzwalacz',
        country: 'Kraj',
        subject: 'Temat',
        body: 'Treść',
        priority: 'Priorytet',
        replyTo: 'Adres odpowiedzi',
        attachments: 'Załączniki',
      },
      values: {
        trigger: {
          registration_submitted: 'Rejestracja przesłana',
          registration_confirmed: 'Rejestracja potwierdzona',
          registration_waitlisted: 'Rejestracja na liście oczekujących',
          registration_waitlist_accepted:
            'Rejestracja z listy oczekujących zaakceptowana',
          registration_updated: 'Rejestracja zaktualizowana',
          registration_canceled: 'Rejestracja anulowana',
        },
      },
    },
  },
};
