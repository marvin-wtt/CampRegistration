export default {
  purpose: {
    registration_administration: 'Gestion de votre inscription',
    participant_communication: "Information avant et pendant l'événement",
    event_organisation: "Organisation et déroulement de l'événement",
    catering: 'Restauration',
    medical_care: "Soins médicaux pendant l'événement",
    emergency_contact: "Prise de contact en cas d'urgence",
    transport: 'Organisation du transport',
    insurance: 'Couverture par une assurance',
    payment_and_invoicing: 'Paiement et facturation',
    photo_documentation: "Documentation interne de l'événement",
    photo_publication: 'Publication de photographies',
    statutory_reporting: 'Déclarations exigées par la loi',
    newsletter: 'Envoi de notre lettre d’information',
  },

  dataCategory: {
    identity: 'Nom',
    date_of_birth: 'Date de naissance',
    gender: 'Genre',
    nationality: 'Nationalité',
    contact: 'Coordonnées (e-mail, téléphone)',
    guardian_contact: 'Coordonnées des parents ou du représentant légal',
    address: 'Adresse postale',
    emergency_contact: "Contact d'urgence",
    identity_document: "Données du document d'identité ou de voyage",
    health: 'Informations de santé',
    disability_support: "Handicap et besoins d'accompagnement",
    allergies: 'Allergies',
    medication: 'Médicaments',
    dietary: 'Besoins alimentaires',
    religion: 'Appartenance religieuse',
    insurance_details: "Données d'assurance",
    payment: 'Données de paiement',
    photos: 'Photographies',
  },

  recipient: {
    event_staff: "L'équipe d'encadrement",
    accommodation_provider: "Le prestataire d'hébergement",
    catering_provider: 'Le prestataire de restauration',
    transport_provider: 'Le transporteur',
    insurer: "L'assureur",
    funding_body: "L'organisme financeur",
    medical_provider: 'Les médecins et les services de secours',
    public_authority: 'Les autorités publiques',
    partner_organization: 'Une organisation partenaire ou co-organisatrice',
    participants: 'Les autres participants',
    it_service_provider:
      'Les prestataires informatiques (p. ex. e-mail, stockage en ligne, comptabilité)',
    payment_provider: 'Le prestataire de paiement',
    platform_operator: "L'exploitant de cette plateforme d'inscription",
  },

  legalBasis: {
    contract: "Exécution d'un contrat",
    legal_obligation: "Respect d'une obligation légale",
    vital_interests: 'Sauvegarde des intérêts vitaux',
    legitimate_interests: 'Intérêts légitimes',
    consent: 'Consentement',
    public_task: "Mission d'intérêt public",
  },

  specialCategoryBasis: {
    explicit_consent: 'Consentement explicite',
    vital_interests: 'Sauvegarde des intérêts vitaux',
    health_care: 'Soins de santé ou action sociale',
    nonprofit_body: "Activités légitimes d'un organisme à but non lucratif",
    legal_claims: 'Constatation ou défense de droits en justice',
    public_interest: "Motif d'intérêt public important prévu par la loi",
  },

  specialCategoryCondition: {
    explicit_consent:
      'Le cas normal pour un événement. La personne doit consentir séparément et pouvoir retirer son consentement à tout moment.',
    nonprofit_body:
      "Uniquement si la personne est membre de votre organisation ou en contact régulier avec elle, et si les données n'en sortent pas.",
    vital_interests:
      "Uniquement lorsque la personne ne peut pas consentir, par exemple si elle est inconsciente lors d'une urgence.",
    health_care:
      'Uniquement si les données sont traitées par une personne soumise au secret professionnel, ou sous sa responsabilité, par exemple un médecin ou un infirmier.',
    legal_claims:
      "Uniquement pour constater, exercer ou défendre un droit en justice, par exemple un constat d'accident conservé pour un litige d'assurance.",
    public_interest:
      "Uniquement si une loi de l'UE ou de votre pays impose ou autorise le traitement ; indiquez cette loi ci-dessous. Demandez un avis juridique avant de vous y appuyer.",
  },

  retentionUntil: {
    period: 'pour une durée déterminée',
    consent_withdrawn:
      "jusqu'au retrait du consentement sur lequel elles reposent",
  },

  retentionConsentSentence:
    'Conservées aussi longtemps que vous y consentez, et effacées dès que vous retirez ce consentement.',

  transferSafeguard: {
    adequacy: "une décision d'adéquation de la Commission européenne",
    scc: 'des clauses contractuelles types',
    bcr: "des règles d'entreprise contraignantes",
    derogation: 'une dérogation',
  },

  /** Voir `en-US/privacy.ts`. */
  editor: {
    field: {
      art9Basis: 'Base légale',
      legalReference: 'Texte de loi applicable',
      legalReferenceHint:
        "La disposition sur laquelle vous vous appuyez, par ex. le code et l'article",
      art9Advisory:
        "Pas sensible en soi. Si votre formulaire propose halal ou casher, cochez aussi « Appartenance religieuse » ; s'il recueille des allergies, cochez « Allergies ».",
      consentQuestion:
        "L'indiquer ici ne vaut pas consentement. Le formulaire d'inscription doit le recueillir dans une question distincte, qui peut rester sans réponse — l'inscription doit rester possible sans lui ({citation}).",
      recipientName: 'Nom (facultatif)',
      recipientNameHint:
        'Nommer le destinataire réel est plus clair que la seule catégorie.',
    },
    action: {
      publish: 'Publier',
      preview: 'Aperçu',
      close: 'Fermer',
    },
    status: {
      live: "Les personnes qui s'inscrivent voient actuellement la version {version}, publiée le {date}.",
      draft: {
        title: 'Brouillon — non publié',
      },
      unpublished: {
        title: 'Modifications non publiées',
        detail: "Vos modifications ne s'appliquent qu'une fois publiées.",
      },
      published: {
        title: 'Publié et à jour',
      },
    },
    preview: {
      title: 'Aperçu',
      hint: "Ce que verront les personnes qui s'inscrivent, y compris les modifications non encore publiées.",
    },
  },

  gap: {
    purpose_basis: "Une finalité n'a pas encore de base légale",
    supervisory_authority: "Aucune autorité de contrôle n'est indiquée",
    purposes: "Aucune finalité de traitement n'a été indiquée",
    legitimate_interest_explanation:
      "Un intérêt légitime est invoqué mais n'est pas décrit",
    custom_purpose_label: "Une finalité que vous avez ajoutée n'a pas de nom",
    data_categories: "Aucune catégorie de données n'a été indiquée",
    special_category_basis: "Les données sensibles n'ont pas de base légale",
    special_category_legal_reference:
      "Une base légale fondée sur une loi n'indique pas cette loi",
    custom_category_label: "Une catégorie que vous avez ajoutée n'a pas de nom",
    custom_recipient_label:
      "Un destinataire que vous avez ajouté n'a pas de nom",
    automated_details:
      "Une décision automatisée est déclarée mais sa logique n'est pas expliquée",
    recipients: "Aucun destinataire n'a été indiqué",
    retention: "Aucune durée de conservation n'a été définie",
    retention_exception:
      "Une exception n'a pas de durée, ou pas d'objet indiqué",
    special_category_retention:
      'Aucune durée pour les données de santé et autres données sensibles, ou une durée plus longue que la durée générale',
    retention_exception_consent_basis:
      "Des données conservées jusqu'au retrait du consentement sont rattachées à une finalité qui ne repose pas sur le consentement",
    transfer_countries:
      "Les transferts hors EEE n'indiquent aucun pays de destination",
    transfer_safeguard: "Les transferts hors EEE n'indiquent aucune garantie",
    dpo_details:
      "Le délégué à la protection des données n'a pas de nom ou d'e-mail",
    free_text:
      "Aucune information sur la protection des données n'a été rédigée",
  },
};
