export default {
  purpose: {
    registration_administration: 'Abwicklung deiner Anmeldung',
    participant_communication: 'Information vor und während der Freizeit',
    camp_organisation: 'Organisation und Durchführung der Freizeit',
    catering: 'Verpflegung',
    medical_care: 'Medizinische Versorgung während der Freizeit',
    emergency_contact: 'Kontaktaufnahme im Notfall',
    transport: 'Organisation der An- und Abreise',
    insurance: 'Versicherungsschutz',
    payment_and_invoicing: 'Zahlung und Rechnungsstellung',
    photo_documentation: 'Interne Dokumentation des Freizeitlebens',
    photo_publication: 'Veröffentlichung von Fotos',
    statutory_reporting: 'Gesetzlich vorgeschriebene Meldungen',
    newsletter: 'Versand unseres Newsletters',
  },

  dataCategory: {
    identity: 'Name',
    date_of_birth: 'Geburtsdatum',
    gender: 'Geschlecht',
    nationality: 'Staatsangehörigkeit',
    contact: 'Kontaktdaten (E-Mail, Telefon)',
    guardian_contact: 'Kontaktdaten der Erziehungsberechtigten',
    address: 'Anschrift',
    emergency_contact: 'Notfallkontakt',
    identity_document: 'Angaben zum Ausweis- oder Reisedokument',
    health: 'Gesundheitsangaben',
    disability_support: 'Behinderung und Unterstützungsbedarf',
    allergies: 'Allergien',
    medication: 'Medikamente',
    dietary: 'Ernährungsbedürfnisse',
    religion: 'Religionszugehörigkeit',
    insurance_details: 'Versicherungsdaten',
    payment: 'Zahlungsdaten',
    photos: 'Fotos',
  },

  recipient: {
    camp_staff: 'Das Team der Freizeit',
    accommodation_provider: 'Der Betreiber der Unterkunft',
    catering_provider: 'Der Caterer',
    transport_provider: 'Das Transportunternehmen',
    insurer: 'Die Versicherung',
    funding_body: 'Der Zuwendungsgeber',
    medical_provider: 'Ärztinnen, Ärzte und Rettungsdienste',
    public_authority: 'Behörden',
    payment_provider: 'Der Zahlungsdienstleister',
    platform_operator: 'Der Betreiber dieser Anmeldeplattform',
  },

  legalBasis: {
    contract: 'Erfüllung eines Vertrags (Art. 6 Abs. 1 lit. b DSGVO)',
    legal_obligation:
      'Erfüllung einer rechtlichen Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO)',
    vital_interests:
      'Schutz lebenswichtiger Interessen (Art. 6 Abs. 1 lit. d DSGVO)',
    legitimate_interests: 'Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)',
    consent: 'Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)',
    public_task:
      'Wahrnehmung einer Aufgabe im öffentlichen Interesse (Art. 6 Abs. 1 lit. e DSGVO)',
  },

  specialCategoryBasis: {
    explicit_consent: 'Ausdrückliche Einwilligung (Art. 9 Abs. 2 lit. a DSGVO)',
    vital_interests:
      'Schutz lebenswichtiger Interessen (Art. 9 Abs. 2 lit. c DSGVO)',
    health_care:
      'Gesundheitsversorgung oder Sozialbereich (Art. 9 Abs. 2 lit. h DSGVO)',
    nonprofit_body:
      'Rechtmäßige Tätigkeit einer nicht gewinnorientierten Einrichtung (Art. 9 Abs. 2 lit. d DSGVO)',
    legal_claims:
      'Geltendmachung oder Verteidigung von Rechtsansprüchen (Art. 9 Abs. 2 lit. f DSGVO)',
  },

  specialCategoryCondition: {
    explicit_consent:
      'Der Normalfall für eine Freizeit. Die Person muss gesondert zustimmen und jederzeit widerrufen können.',
    nonprofit_body:
      'Nur wenn die Person Mitglied eurer Organisation ist oder in regelmäßigem Kontakt zu ihr steht und die Daten die Organisation nicht verlassen.',
    vital_interests:
      'Nur wenn die Person nicht einwilligen kann, etwa wenn sie im Notfall bewusstlos ist.',
    health_care:
      'Nur wenn die Daten von einer der Schweigepflicht unterliegenden Person oder unter deren Verantwortung verarbeitet werden, etwa von einer Ärztin oder einer Pflegekraft.',
    legal_claims:
      'Nur zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen, etwa ein Unfallbericht für einen Versicherungsstreit.',
  },

  retentionAnchor: {
    camp_end: 'nach Ende der Freizeit',
    submission: 'nach Absenden der Anmeldung',
  },

  retentionUntil: {
    period: 'für eine feste Dauer',
    consent_withdrawn: 'bis die zugrunde liegende Einwilligung widerrufen wird',
  },

  retentionConsentSentence:
    'Wird so lange gespeichert, wie du einwilligst, und nach deinem Widerruf gelöscht.',

  transferSafeguard: {
    adequacy: 'einen Angemessenheitsbeschluss der Europäischen Kommission',
    scc: 'Standardvertragsklauseln',
    bcr: 'verbindliche interne Datenschutzvorschriften',
    derogation: 'eine Ausnahme nach Art. 49 DSGVO',
  },

  /** Siehe `en-US/privacy.ts`. */
  editor: {
    field: {
      art9Basis: 'Rechtsgrundlage',
      art9Other: 'Andere Rechtsgrundlage wählen',
      art9Advisory:
        'Für sich genommen nicht sensibel. Wenn das Formular halal oder koscher zur Auswahl stellt, wähle zusätzlich „Religionszugehörigkeit“; werden Allergien erfasst, wähle „Allergien“.',
      consentQuestion:
        'Die Angabe hier ist keine Einwilligung. Das Anmeldeformular muss sie in einer eigenen Frage einholen, die unbeantwortet bleiben darf – die Anmeldung muss auch ohne sie möglich sein (Art. 7 Abs. 4 DSGVO).',
      recipientName: 'Name (optional)',
      recipientNameHint:
        'Den konkreten Empfänger zu nennen ist klarer als nur die Kategorie.',
    },
    origin: {
      organization: 'Von der Organisation',
      camp: 'Hier ergänzt',
    },
    action: {
      publish: 'Veröffentlichen',
      preview: 'Vorschau',
      close: 'Schließen',
    },
    status: {
      live: 'Anmeldende sehen derzeit Version {version}, veröffentlicht am {date}.',
      draft: {
        title: 'Entwurf – nicht veröffentlicht',
      },
      unpublished: {
        title: 'Nicht veröffentlichte Änderungen',
        detail: 'Deine Änderungen gelten erst, wenn du sie veröffentlichst.',
      },
      published: {
        title: 'Veröffentlicht und aktuell',
      },
    },
    preview: {
      title: 'Vorschau',
      hint: 'So sehen Anmeldende die Informationen – einschließlich noch nicht veröffentlichter Änderungen.',
    },
  },

  gap: {
    purposes: 'Es wurde kein Verarbeitungszweck angegeben',
    legitimate_interest_explanation:
      'Ein berechtigtes Interesse wird herangezogen, aber nicht beschrieben',
    custom_purpose_label: 'Ein selbst hinzugefügter Zweck hat keinen Namen',
    data_categories: 'Es wurden keine Datenkategorien angegeben',
    special_category_basis:
      'Für besondere Kategorien personenbezogener Daten fehlt eine Rechtsgrundlage nach Art. 9',
    custom_category_label:
      'Eine selbst hinzugefügte Kategorie hat keinen Namen',
    automated_details:
      'Automatisierte Entscheidungsfindung ist angegeben, aber die Logik wird nicht erläutert',
    recipients: 'Es wurden keine Empfänger angegeben',
    retention: 'Es wurde keine Speicherdauer festgelegt',
    retention_exception:
      'Einer Ausnahme fehlt die Frist oder die Angabe, wofür sie gilt',
    retention_exception_consent_basis:
      'Daten, die bis zum Widerruf gespeichert werden, gehören zu einem Zweck, der nicht auf einer Einwilligung beruht',
    transfer_countries:
      'Für Übermittlungen außerhalb des EWR fehlt das Zielland',
    transfer_safeguard:
      'Für Übermittlungen außerhalb des EWR fehlt die Garantie',
    dpo_details:
      'Für die datenschutzbeauftragte Person fehlt Name oder E-Mail-Adresse',
    free_text: 'Es wurden keine Datenschutzinformationen verfasst',
  },
};
