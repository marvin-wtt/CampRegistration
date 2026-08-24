export default {
  purpose: {
    registration_administration: 'Vyřízení tvé přihlášky',
    participant_communication: 'Informování před akcí a v jejím průběhu',
    camp_organisation: 'Organizace a průběh akce',
    catering: 'Stravování',
    medical_care: 'Zdravotní péče v průběhu akce',
    emergency_contact: 'Kontaktování v naléhavém případě',
    transport: 'Zajištění dopravy',
    insurance: 'Pojištění',
    payment_and_invoicing: 'Platby a fakturace',
    photo_documentation: 'Interní dokumentace akce',
    photo_publication: 'Zveřejňování fotografií',
    statutory_reporting: 'Hlášení vyžadovaná zákonem',
    newsletter: 'Zasílání našeho newsletteru',
  },

  dataCategory: {
    identity: 'Jméno',
    date_of_birth: 'Datum narození',
    gender: 'Pohlaví',
    nationality: 'Státní příslušnost',
    contact: 'Kontaktní údaje (e-mail, telefon)',
    guardian_contact: 'Kontaktní údaje zákonného zástupce',
    address: 'Poštovní adresa',
    emergency_contact: 'Nouzový kontakt',
    identity_document: 'Údaje z dokladu totožnosti nebo cestovního dokladu',
    health: 'Údaje o zdravotním stavu',
    disability_support: 'Postižení a potřeba podpory',
    allergies: 'Alergie',
    medication: 'Léky',
    dietary: 'Stravovací požadavky',
    religion: 'Náboženské vyznání',
    insurance_details: 'Údaje o pojištění',
    payment: 'Platební údaje',
    photos: 'Fotografie',
  },

  recipient: {
    camp_staff: 'Tým akce',
    accommodation_provider: 'Poskytovatel ubytování',
    catering_provider: 'Poskytovatel stravování',
    transport_provider: 'Dopravce',
    insurer: 'Pojišťovna',
    funding_body: 'Poskytovatel dotace',
    medical_provider: 'Lékaři a záchranná služba',
    public_authority: 'Orgány veřejné moci',
    payment_provider: 'Poskytovatel platebních služeb',
    platform_operator: 'Provozovatel této přihlašovací platformy',
  },

  legalBasis: {
    contract: 'Plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR)',
    legal_obligation: 'Splnění právní povinnosti (čl. 6 odst. 1 písm. c) GDPR)',
    vital_interests:
      'Ochrana životně důležitých zájmů (čl. 6 odst. 1 písm. d) GDPR)',
    legitimate_interests: 'Oprávněné zájmy (čl. 6 odst. 1 písm. f) GDPR)',
    consent: 'Souhlas (čl. 6 odst. 1 písm. a) GDPR)',
    public_task: 'Plnění úkolu ve veřejném zájmu (čl. 6 odst. 1 písm. e) GDPR)',
  },

  specialCategoryBasis: {
    explicit_consent: 'Výslovný souhlas (čl. 9 odst. 2 písm. a) GDPR)',
    vital_interests:
      'Ochrana životně důležitých zájmů (čl. 9 odst. 2 písm. c) GDPR)',
    health_care: 'Zdravotní nebo sociální péče (čl. 9 odst. 2 písm. h) GDPR)',
    nonprofit_body:
      'Oprávněná činnost neziskové organizace (čl. 9 odst. 2 písm. d) GDPR)',
    legal_claims:
      'Určení nebo obhajoba právních nároků (čl. 9 odst. 2 písm. f) GDPR)',
  },

  specialCategoryCondition: {
    explicit_consent:
      'Běžný případ u akce. Osoba musí souhlasit zvlášť a musí mít možnost souhlas kdykoli odvolat.',
    nonprofit_body:
      'Jen pokud je osoba členem vaší organizace nebo je s ní v pravidelném kontaktu a údaje organizaci neopustí.',
    vital_interests:
      'Jen když osoba nemůže dát souhlas, například je-li v nouzové situaci v bezvědomí.',
    health_care:
      'Jen pokud údaje zpracovává osoba vázaná povinností mlčenlivosti nebo se tak děje na její odpovědnost, například lékař nebo zdravotní sestra.',
    legal_claims:
      'Jen pro určení, výkon nebo obhajobu právních nároků, například záznam o úrazu uchovaný pro spor s pojišťovnou.',
  },

  retentionAnchor: {
    camp_end: 'po skončení akce',
    submission: 'po odeslání přihlášky',
  },

  retentionUntil: {
    period: 'po pevně danou dobu',
    consent_withdrawn: 'dokud není odvolán souhlas, na kterém stojí',
  },

  retentionConsentSentence:
    'Uchováváme je tak dlouho, dokud s tím souhlasíš, a po odvolání souhlasu je smažeme.',

  transferSafeguard: {
    adequacy: 'rozhodnutí Evropské komise o odpovídající ochraně',
    scc: 'standardní smluvní doložky',
    bcr: 'závazná podniková pravidla',
    derogation: 'výjimku podle čl. 49 GDPR',
  },

  /** Viz `en-US/privacy.ts`. */
  editor: {
    field: {
      art9Basis: 'Právní základ',
      art9Other: 'Zvolit jiný právní základ',
      art9Advisory:
        'Samo o sobě není citlivé. Pokud formulář nabízí halal nebo košer, zaškrtni také „Náboženské vyznání“; pokud sbírá alergie, zaškrtni „Alergie“.',
      consentQuestion:
        'Uvedení zde není souhlas. Přihlašovací formulář si jej musí vyžádat samostatnou otázkou, která může zůstat nezodpovězená – přihlášení musí být možné i bez něj (čl. 7 odst. 4 GDPR).',
      recipientName: 'Název (volitelné)',
      recipientNameHint:
        'Uvést konkrétního příjemce je srozumitelnější než jen kategorii.',
    },
    origin: {
      organization: 'Od organizace',
      camp: 'Doplněno zde',
    },
    action: {
      publish: 'Zveřejnit',
      preview: 'Náhled',
      close: 'Zavřít',
    },
    status: {
      live: 'Přihlašující nyní vidí verzi {version}, zveřejněnou {date}.',
      draft: {
        title: 'Koncept – nezveřejněno',
      },
      unpublished: {
        title: 'Nezveřejněné změny',
        detail: 'Tvoje změny začnou platit až po zveřejnění.',
      },
      published: {
        title: 'Zveřejněno a aktuální',
      },
    },
    preview: {
      title: 'Náhled',
      hint: 'Jak informace uvidí přihlašující se – včetně dosud nezveřejněných změn.',
    },
  },

  gap: {
    purposes: 'Nebyl uveden žádný účel zpracování',
    legitimate_interest_explanation:
      'Je uplatněn oprávněný zájem, ale není popsán',
    custom_purpose_label: 'Vlastní přidaný účel nemá název',
    data_categories: 'Nebyly uvedeny žádné kategorie údajů',
    special_category_basis:
      'Zvláštní kategorie údajů nemají právní základ podle čl. 9',
    custom_category_label: 'Vlastní přidaná kategorie nemá název',
    automated_details:
      'Automatizované rozhodování je uvedeno, ale jeho logika není vysvětlena',
    recipients: 'Nebyli uvedeni žádní příjemci',
    retention: 'Nebyla stanovena doba uchování',
    retention_exception: 'U výjimky chybí doba nebo údaj, čeho se týká',
    retention_exception_consent_basis:
      'Údaje uchovávané do odvolání souhlasu patří k účelu, který na souhlasu nestojí',
    transfer_countries: 'U předávání mimo EHP není uvedena cílová země',
    transfer_safeguard: 'U předávání mimo EHP nejsou uvedeny záruky',
    dpo_details:
      'U pověřence pro ochranu osobních údajů chybí jméno nebo e-mail',
    free_text: 'Nebyly sepsány žádné informace o ochraně osobních údajů',
  },
};
