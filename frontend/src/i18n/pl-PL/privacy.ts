export default {
  purpose: {
    registration_administration: 'Obsługa Twojego zgłoszenia',
    participant_communication: 'Informowanie przed obozem i w jego trakcie',
    camp_organisation: 'Organizacja i przebieg obozu',
    catering: 'Wyżywienie',
    medical_care: 'Opieka medyczna podczas obozu',
    emergency_contact: 'Kontakt w sytuacji awaryjnej',
    transport: 'Organizacja transportu',
    insurance: 'Ochrona ubezpieczeniowa',
    payment_and_invoicing: 'Płatności i fakturowanie',
    photo_documentation: 'Wewnętrzna dokumentacja życia obozowego',
    photo_publication: 'Publikowanie zdjęć',
    statutory_reporting: 'Zgłoszenia wymagane przepisami prawa',
    newsletter: 'Wysyłka naszego newslettera',
  },

  dataCategory: {
    identity: 'Imię i nazwisko',
    date_of_birth: 'Data urodzenia',
    gender: 'Płeć',
    nationality: 'Obywatelstwo',
    contact: 'Dane kontaktowe (e-mail, telefon)',
    guardian_contact: 'Dane kontaktowe rodzica lub opiekuna',
    address: 'Adres pocztowy',
    emergency_contact: 'Kontakt awaryjny',
    identity_document: 'Dane dokumentu tożsamości lub podróży',
    health: 'Informacje o zdrowiu',
    disability_support: 'Niepełnosprawność i potrzeby wsparcia',
    allergies: 'Alergie',
    medication: 'Przyjmowane leki',
    dietary: 'Wymagania żywieniowe',
    religion: 'Przynależność religijna',
    insurance_details: 'Dane ubezpieczenia',
    payment: 'Dane płatnicze',
    photos: 'Zdjęcia',
  },

  recipient: {
    camp_staff: 'Zespół obozu',
    accommodation_provider: 'Podmiot zapewniający zakwaterowanie',
    catering_provider: 'Firma cateringowa',
    transport_provider: 'Przewoźnik',
    insurer: 'Ubezpieczyciel',
    funding_body: 'Podmiot finansujący',
    medical_provider: 'Lekarze i służby ratunkowe',
    public_authority: 'Organy publiczne',
    payment_provider: 'Dostawca usług płatniczych',
    platform_operator: 'Operator tej platformy zgłoszeniowej',
  },

  legalBasis: {
    contract: 'Wykonanie umowy (art. 6 ust. 1 lit. b RODO)',
    legal_obligation:
      'Wypełnienie obowiązku prawnego (art. 6 ust. 1 lit. c RODO)',
    vital_interests: 'Ochrona żywotnych interesów (art. 6 ust. 1 lit. d RODO)',
    legitimate_interests:
      'Prawnie uzasadnione interesy (art. 6 ust. 1 lit. f RODO)',
    consent: 'Zgoda (art. 6 ust. 1 lit. a RODO)',
    public_task:
      'Wykonanie zadania w interesie publicznym (art. 6 ust. 1 lit. e RODO)',
  },

  specialCategoryBasis: {
    explicit_consent: 'Wyraźna zgoda (art. 9 ust. 2 lit. a RODO)',
    vital_interests: 'Ochrona żywotnych interesów (art. 9 ust. 2 lit. c RODO)',
    health_care: 'Opieka zdrowotna lub społeczna (art. 9 ust. 2 lit. h RODO)',
    nonprofit_body:
      'Uprawniona działalność podmiotu niezarobkowego (art. 9 ust. 2 lit. d RODO)',
    legal_claims: 'Ustalenie lub obrona roszczeń (art. 9 ust. 2 lit. f RODO)',
  },

  specialCategoryCondition: {
    explicit_consent:
      'Zwykły przypadek przy obozie. Osoba musi wyrazić zgodę osobno i móc ją w każdej chwili wycofać.',
    nonprofit_body:
      'Tylko jeśli osoba jest członkiem Waszej organizacji lub pozostaje z nią w regularnym kontakcie, a dane nie wychodzą poza organizację.',
    vital_interests:
      'Tylko gdy osoba nie może wyrazić zgody, na przykład jest nieprzytomna w sytuacji nagłej.',
    health_care:
      'Tylko jeśli dane przetwarza osoba zobowiązana do tajemnicy zawodowej lub odbywa się to na jej odpowiedzialność, na przykład lekarz lub pielęgniarka.',
    legal_claims:
      'Tylko w celu ustalenia, dochodzenia lub obrony roszczeń, na przykład protokół wypadku zachowany na potrzeby sporu z ubezpieczycielem.',
  },

  retentionAnchor: {
    camp_end: 'po zakończeniu obozu',
    submission: 'po przesłaniu zgłoszenia',
  },

  transferSafeguard: {
    adequacy:
      'decyzję Komisji Europejskiej stwierdzającą odpowiedni stopień ochrony',
    scc: 'standardowe klauzule umowne',
    bcr: 'wiążące reguły korporacyjne',
    derogation: 'wyjątek na podstawie art. 49 RODO',
  },

  /** Zobacz `en-US/privacy.ts`. */
  editor: {
    field: {
      art9Basis: 'Podstawa prawna',
      art9Other: 'Wybierz inną podstawę prawną',
      art9Advisory:
        'Same w sobie nie są wrażliwe. Jeśli formularz oferuje opcje halal lub koszerne, zaznacz też „Przynależność religijna”; jeśli zbiera alergie, zaznacz „Alergie”.',
      consentQuestion:
        'Wskazanie tego tutaj nie jest zgodą. Formularz zgłoszeniowy musi o nią zapytać w osobnym pytaniu, które można pozostawić bez odpowiedzi – zgłoszenie musi być możliwe także bez niej (art. 7 ust. 4 RODO).',
      recipientName: 'Nazwa (opcjonalnie)',
      recipientNameHint:
        'Wskazanie konkretnego odbiorcy jest jaśniejsze niż sama kategoria.',
    },
    origin: {
      organization: 'Od organizacji',
      camp: 'Dodano tutaj',
    },
    action: {
      publish: 'Opublikuj',
      preview: 'Podgląd',
      close: 'Zamknij',
    },
    status: {
      live: 'Osoby zgłaszające się widzą obecnie wersję {version}, opublikowaną {date}.',
      draft: {
        title: 'Wersja robocza – nieopublikowana',
      },
      unpublished: {
        title: 'Nieopublikowane zmiany',
        detail: 'Twoje zmiany zaczną obowiązywać dopiero po opublikowaniu.',
      },
      published: {
        title: 'Opublikowano i aktualne',
      },
    },
    preview: {
      title: 'Podgląd',
      hint: 'Jak zobaczą to osoby zgłaszające się – łącznie z jeszcze nieopublikowanymi zmianami.',
    },
  },

  gap: {
    purposes: 'Nie wskazano żadnego celu przetwarzania',
    legitimate_interest_explanation:
      'Powołano się na prawnie uzasadniony interes, ale go nie opisano',
    custom_purpose_label: 'Dodany przez Ciebie cel nie ma nazwy',
    data_categories: 'Nie wskazano żadnych kategorii danych',
    special_category_basis:
      'Szczególne kategorie danych nie mają podstawy prawnej z art. 9',
    custom_category_label: 'Dodana przez Ciebie kategoria nie ma nazwy',
    automated_details:
      'Zadeklarowano zautomatyzowane podejmowanie decyzji, ale nie wyjaśniono jego zasad',
    recipients: 'Nie wskazano żadnych odbiorców',
    retention: 'Nie określono okresu przechowywania',
    retention_exception:
      'Wyjątek nie ma okresu albo nie wskazano, czego dotyczy',
    transfer_countries:
      'Przy przekazywaniu poza EOG nie wskazano kraju docelowego',
    transfer_safeguard: 'Przy przekazywaniu poza EOG nie wskazano zabezpieczeń',
    dpo_details: 'Inspektor ochrony danych nie ma nazwiska lub adresu e-mail',
    free_text: 'Nie sporządzono żadnych informacji o ochronie danych',
  },
};
