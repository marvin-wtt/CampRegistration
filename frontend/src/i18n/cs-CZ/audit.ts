export default {
  actions: {
    created: 'Vytvořeno',
    updated: 'Aktualizováno',
    deleted: 'Smazáno',
  },
  reason: 'Důvod',
  deletedUser: 'Smazaný uživatel',
  today: 'Dnes',
  yesterday: 'Včera',
  viewInSettings: 'Zobrazit v nastavení',
  entities: {
    event: {
      label: 'Akce',
      fields: {
        organizationId: 'Organizace',
        listed: 'Zobrazit akci na úvodní stránce',
        registrationOpensAt: 'Registrace se otevírá',
        registrationClosesAt: 'Registrace se zavírá',
        confirmationMode: 'Režim potvrzení',
        countries: 'Země',
        name: 'Název',
        organizer: 'Organizátor',
        contactEmail: 'Kontaktní e-mail',
        maxParticipants: 'Maximální počet účastníků',
        minAge: 'Minimální věk',
        maxAge: 'Maximální věk',
        startAt: 'Datum zahájení',
        endAt: 'Datum ukončení',
        price: 'Cena',
        location: 'Místo',
        timezone: 'Časové pásmo',
        form: 'Registrační formulář',
        payoutNumberPrefix: 'Předpona čísel výplat',
      },
    },
    registration: {
      label: 'Registrace',
      fields: {
        data: 'Odpověď z formuláře',
        customData: 'Vlastní pole',
        customFiles: 'Vlastní soubor',
        status: 'Stav',
        country: 'Země',
        group: 'Skupina',
      },
      values: {
        status: {
          ACCEPTED: 'Přijato',
          PENDING: 'Čeká na schválení',
          WAITLISTED: 'Na čekací listině',
        },
      },
      reasons: {
        canceled: 'Zrušeno',
        declined: 'Zamítnuto',
        duplicate: 'Duplikát',
        test_entry: 'Testovací záznam',
        other: 'Jiné',
      },
      deleted: 'Smazaná registrace',
      view: 'Zobrazit registraci',
      gone: 'Tato registrace již neexistuje',
    },
    eventManager: {
      label: 'Přístup',
      reasons: {
        account_deleted: 'Účet smazán',
      },
      fields: {
        role: 'Role',
        expiresAt: 'Vyprší',
      },
      values: {
        role: {
          DIRECTOR: 'Vedení',
          COORDINATOR: 'Koordinace',
          TREASURER: 'Pokladna',
          COUNSELOR: 'Dozor',
          VIEWER: 'Jen čtení',
        },
      },
    },
    message: {
      label: 'Zpráva',
      fields: {
        recipients: 'Příjemci',
      },
      actions: {
        sent: 'Odesláno',
      },
      view: 'Zobrazit zprávu',
      gone: 'Tato zpráva již neexistuje',
    },
    expense: {
      label: 'Výdaj',
      fields: {
        type: 'Druh',
        amount: 'Částka',
        originalAmount: 'Původní částka',
        originalCurrency: 'Původní měna',
        date: 'Datum',
        description: 'Popis',
        categoryId: 'Kategorie',
        paidByUserId: 'Zaplatil(a)',
        paidByName: 'Zaplatil(a) (jméno)',
        files: 'Soubory dokladů',
        receiptNumber: 'Číslo dokladu',
      },
      values: {
        type: {
          EXPENSE: 'Výdaj',
          REFUND: 'Vratka',
        },
      },
    },
    expenseCategory: {
      label: 'Kategorie výdajů',
      fields: {
        name: 'Název',
        parentId: 'Skupina',
        position: 'Pořadí',
        archivedAt: 'Archivováno',
      },
    },
    payout: {
      label: 'Výplata',
      actions: {
        signed: 'Podepsáno',
        unsigned: 'Podpis odebrán',
      },
      fields: {
        recipientUserId: 'Příjemce',
        recipientName: 'Příjemce (jméno)',
        direction: 'Směr',
        amount: 'Částka',
        note: 'Poznámka',
        number: 'Číslo',
        paidOn: 'Zaplaceno',
        signedAt: 'Podepsáno',
      },
      values: {
        direction: {
          OUT: 'Vyplaceno',
          IN: 'Vráceno',
        },
      },
    },
    messageTemplate: {
      label: 'Automatický e-mail',
      fields: {
        trigger: 'Spouštěč',
        group: 'Skupina',
        subject: 'Předmět',
        body: 'Obsah',
        priority: 'Priorita',
        replyTo: 'Adresa pro odpověď',
        attachments: 'Přílohy',
      },
      values: {
        trigger: {
          registration_submitted: 'Registrace odeslána',
          registration_confirmed: 'Registrace potvrzena',
          registration_waitlisted: 'Registrace na čekací listině',
          registration_waitlist_accepted: 'Registrace z čekací listiny přijata',
          registration_updated: 'Registrace aktualizována',
          registration_canceled: 'Registrace zrušena',
        },
      },
    },
  },
};
