/**
 * Vocabulary of the privacy notice catalogue
 * (`common/src/privacy/catalogue.ts`), shared by the authoring wizard and the
 * notice a registrant reads — the same key must never read differently in the
 * two places.
 *
 * These strings are the compliance-critical part of the feature: every
 * organization's notice is assembled from them. Treat a change here as a legal
 * change, not a copy tweak.
 */
export default {
  purpose: {
    registration_administration: 'Administering your registration',
    participant_communication:
      'Keeping you informed before and during the event',
    camp_organisation: 'Organising and running the event',
    catering: 'Catering',
    medical_care: 'Medical care during the event',
    emergency_contact: 'Contacting someone in an emergency',
    transport: 'Organising transport',
    insurance: 'Insurance cover',
    payment_and_invoicing: 'Payment and invoicing',
    photo_documentation: 'Internal documentation of the event',
    photo_publication: 'Publishing photographs',
    statutory_reporting: 'Reporting required by law',
    newsletter: 'Sending our newsletter',
  },

  dataCategory: {
    identity: 'Name',
    date_of_birth: 'Date of birth',
    gender: 'Gender',
    nationality: 'Nationality',
    contact: 'Contact details (email, phone)',
    guardian_contact: 'Parent or guardian contact details',
    address: 'Postal address',
    emergency_contact: 'Emergency contact',
    identity_document: 'Identity or travel document details',
    health: 'Health information',
    disability_support: 'Disability and support needs',
    allergies: 'Allergies',
    medication: 'Medication',
    dietary: 'Dietary requirements',
    religion: 'Religious affiliation',
    insurance_details: 'Insurance details',
    payment: 'Payment details',
    photos: 'Photographs',
  },

  recipient: {
    camp_staff: 'The event team',
    accommodation_provider: 'The accommodation provider',
    catering_provider: 'The catering provider',
    transport_provider: 'The transport provider',
    insurer: 'The insurer',
    funding_body: 'The funding body',
    medical_provider: 'Doctors and emergency services',
    public_authority: 'Public authorities',
    payment_provider: 'The payment provider',
    platform_operator: 'The operator of this registration platform',
  },

  legalBasis: {
    contract: 'Performance of a contract (Art. 6(1)(b) GDPR)',
    legal_obligation: 'Compliance with a legal obligation (Art. 6(1)(c) GDPR)',
    vital_interests: 'Protection of vital interests (Art. 6(1)(d) GDPR)',
    legitimate_interests: 'Legitimate interests (Art. 6(1)(f) GDPR)',
    consent: 'Consent (Art. 6(1)(a) GDPR)',
    public_task: 'Task carried out in the public interest (Art. 6(1)(e) GDPR)',
  },

  specialCategoryBasis: {
    explicit_consent: 'Explicit consent (Art. 9(2)(a) GDPR)',
    vital_interests: 'Protection of vital interests (Art. 9(2)(c) GDPR)',
    health_care: 'Health or social care (Art. 9(2)(h) GDPR)',
    nonprofit_body:
      'Legitimate activities of a not-for-profit body (Art. 9(2)(d) GDPR)',
    legal_claims:
      'Establishment or defence of legal claims (Art. 9(2)(f) GDPR)',
  },

  specialCategoryCondition: {
    explicit_consent:
      'The normal basis for an event. The person must agree separately and be able to withdraw at any time.',
    nonprofit_body:
      'Only if the person is a member of, or in regular contact with, your organisation, and the data stays inside it.',
    vital_interests:
      'Only where the person cannot give consent, for example while unconscious in an emergency.',
    health_care:
      'Only if the data is handled by, or under the responsibility of, someone bound by professional secrecy, such as a doctor or nurse.',
    legal_claims:
      'Only for establishing, exercising or defending a legal claim, such as an accident report kept for an insurance dispute.',
  },

  retentionAnchor: {
    camp_end: 'after the event ends',
    submission: 'after you submit the registration',
  },

  retentionUntil: {
    period: 'for a fixed period',
    consent_withdrawn: 'until the consent behind it is withdrawn',
  },

  retentionConsentSentence:
    'Kept for as long as you consent to it, and erased once you withdraw that consent.',

  transferSafeguard: {
    adequacy: 'an adequacy decision of the European Commission',
    scc: 'standard contractual clauses',
    bcr: 'binding corporate rules',
    derogation: 'a derogation under Art. 49 GDPR',
  },

  /**
   * The wording the two authoring UIs share — an organization's notice and a
   * event's additions to it. Global rather than per-page so the same control
   * cannot end up labelled differently in the two of them.
   */
  editor: {
    field: {
      art9Basis: 'Legal basis',
      art9Other: 'Use a different legal basis',
      art9Advisory:
        'Not sensitive in itself. If your form offers halal or kosher options, also tick “Religious affiliation”; if it collects allergies, tick “Allergies”.',
      consentQuestion:
        'Saying so here is not consent. The registration form has to ask for it in a question of its own that may be left unanswered — registering must stay possible without it (Art. 7(4) GDPR).',
      recipientName: 'Name (optional)',
      recipientNameHint:
        'Naming the actual recipient is clearer than the category alone.',
    },
    /** Which of the two authors an entry came from. */
    origin: {
      organization: 'From your organisation',
      event: 'Added here',
    },
    action: {
      publish: 'Publish',
      preview: 'Preview',
      close: 'Close',
    },
    status: {
      live: 'Registrants currently see version {version}, published {date}.',
      draft: {
        title: 'Draft — not published',
      },
      unpublished: {
        title: 'Unpublished changes',
        detail: 'Nothing you changed is live until you publish it.',
      },
      published: {
        title: 'Published and up to date',
      },
    },
    preview: {
      title: 'Preview',
      hint: 'How registrants will read it, including changes you have not published yet.',
    },
  },

  gap: {
    purposes: 'No purpose of processing has been given',
    legitimate_interest_explanation:
      'A legitimate interest is relied on but not described',
    custom_purpose_label: 'A purpose you added has no name',
    data_categories: 'No categories of data have been listed',
    special_category_basis:
      'Special category data has no legal basis under Art. 9',
    custom_category_label: 'A category you added has no name',
    automated_details:
      'Automated decision-making is declared but its logic is not explained',
    recipients: 'No recipients have been listed',
    retention: 'No retention period has been set',
    retention_exception:
      'An exception has no period, or no name for what it covers',
    retention_exception_consent_basis:
      'Data kept until consent is withdrawn is tied to a purpose that does not rest on consent',
    transfer_countries: 'Transfers outside the EEA name no destination country',
    transfer_safeguard: 'Transfers outside the EEA name no safeguard',
    dpo_details: 'The data protection officer has no name or email',
    free_text: 'No privacy information has been written',
  },
};
