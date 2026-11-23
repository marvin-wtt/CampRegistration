export default {
  purpose: {
    registration_administration: 'Vyřízení tvé přihlášky',
    participant_communication: 'Informování před akcí a v jejím průběhu',
    event_organisation: 'Organizace a průběh akce',
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
    event_staff: 'Tým akce',
    accommodation_provider: 'Poskytovatel ubytování',
    catering_provider: 'Poskytovatel stravování',
    transport_provider: 'Dopravce',
    insurer: 'Pojišťovna',
    funding_body: 'Poskytovatel dotace',
    medical_provider: 'Lékaři a záchranná služba',
    public_authority: 'Orgány veřejné moci',
    partner_organization: 'Partnerská nebo spolupořádající organizace',
    participants: 'Ostatní účastníci',
    it_service_provider:
      'Poskytovatelé IT služeb (např. e-mail, cloudové úložiště, účetnictví)',
    payment_provider: 'Poskytovatel platebních služeb',
    platform_operator: 'Provozovatel této přihlašovací platformy',
  },

  legalBasis: {
    contract: 'Plnění smlouvy',
    legal_obligation: 'Splnění právní povinnosti',
    vital_interests: 'Ochrana životně důležitých zájmů',
    legitimate_interests: 'Oprávněné zájmy',
    consent: 'Souhlas',
    public_task: 'Plnění úkolu ve veřejném zájmu',
  },

  specialCategoryBasis: {
    explicit_consent: 'Výslovný souhlas',
    vital_interests: 'Ochrana životně důležitých zájmů',
    health_care: 'Zdravotní nebo sociální péče',
    nonprofit_body: 'Oprávněná činnost neziskové organizace',
    legal_claims: 'Určení nebo obhajoba právních nároků',
    public_interest: 'Významný veřejný zájem na základě zákona',
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
    public_interest:
      'Jen pokud zpracování ukládá nebo dovoluje zákon EU nebo tvé země; uveď tento zákon níže. Než se na něj spolehneš, nech si poradit.',
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
    derogation: 'výjimku',
  },

  /** Viz `en-US/privacy.ts`. */
  editor: {
    field: {
      art9Basis: 'Právní základ',
      legalReference: 'Zákonný základ',
      legalReferenceHint:
        'Ustanovení, o které se opíráš, např. zákon a paragraf',
      art9Advisory:
        'Samo o sobě není citlivé. Pokud formulář nabízí halal nebo košer, zaškrtni také „Náboženské vyznání“; pokud sbírá alergie, zaškrtni „Alergie“.',
      consentQuestion:
        'Uvedení zde není souhlas. Přihlašovací formulář si jej musí vyžádat samostatnou otázkou, která může zůstat nezodpovězená – přihlášení musí být možné i bez něj ({citation}).',
      recipientName: 'Název (volitelné)',
      recipientNameHint:
        'Uvést konkrétního příjemce je srozumitelnější než jen kategorii.',
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
    purpose_basis: 'Jeden z účelů zatím nemá právní základ',
    supervisory_authority: 'Není uveden žádný dozorový úřad',
    purposes: 'Nebyl uveden žádný účel zpracování',
    legitimate_interest_explanation:
      'Je uplatněn oprávněný zájem, ale není popsán',
    custom_purpose_label: 'Vlastní přidaný účel nemá název',
    data_categories: 'Nebyly uvedeny žádné kategorie údajů',
    special_category_basis: 'Zvláštní kategorie údajů nemají právní základ',
    special_category_legal_reference:
      'Právní základ opřený o zákon tento zákon neuvádí',
    custom_category_label: 'Vlastní přidaná kategorie nemá název',
    custom_recipient_label: 'Vámi přidaný příjemce nemá název',
    automated_details:
      'Automatizované rozhodování je uvedeno, ale jeho logika není vysvětlena',
    recipients: 'Nebyli uvedeni žádní příjemci',
    retention: 'Nebyla stanovena doba uchování',
    retention_exception: 'U výjimky chybí doba nebo údaj, čeho se týká',
    special_category_retention:
      'Pro zdravotní a další citlivé údaje chybí doba, nebo je delší než obecná',
    retention_exception_consent_basis:
      'Údaje uchovávané do odvolání souhlasu patří k účelu, který na souhlasu nestojí',
    transfer_countries: 'U předávání mimo EHP není uvedena cílová země',
    transfer_safeguard: 'U předávání mimo EHP nejsou uvedeny záruky',
    dpo_details:
      'U pověřence pro ochranu osobních údajů chybí jméno nebo e-mail',
    free_text: 'Nebyly sepsány žádné informace o ochraně osobních údajů',
  },
};
