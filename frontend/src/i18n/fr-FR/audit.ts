export default {
  actions: {
    created: 'Créé',
    updated: 'Modifié',
    deleted: 'Supprimé',
  },
  reason: 'Motif',
  deletedUser: 'Utilisateur supprimé',
  today: 'Aujourd’hui',
  yesterday: 'Hier',
  viewInSettings: 'Voir dans les paramètres',
  entities: {
    event: {
      label: 'Événement',
      fields: {
        organizationId: 'Organisation',
        listed: "Afficher l'événement sur la page d'accueil",
        registrationOpensAt: 'Ouverture des inscriptions',
        registrationClosesAt: 'Fermeture des inscriptions',
        confirmationMode: 'Mode de confirmation',
        countries: 'Pays',
        name: 'Nom',
        organizer: 'Organisateur',
        contactEmail: 'E-mail de contact',
        maxParticipants: 'Nombre maximum de participants',
        minAge: 'Âge minimum',
        maxAge: 'Âge maximum',
        startAt: 'Date de début',
        endAt: 'Date de fin',
        price: 'Prix',
        location: 'Lieu',
        timezone: 'Fuseau horaire',
        form: 'Formulaire d’inscription',
        payoutNumberPrefix: 'Préfixe des numéros de versement',
      },
    },
    registration: {
      label: 'Inscription',
      fields: {
        data: 'Réponse du formulaire',
        customData: 'Champ personnalisé',
        customFiles: 'Fichier personnalisé',
        status: 'Statut',
        country: 'Pays',
        group: 'Groupe',
      },
      values: {
        status: {
          ACCEPTED: 'Accepté',
          PENDING: 'En attente',
          WAITLISTED: "Liste d'attente",
        },
      },
      reasons: {
        canceled: 'Annulée',
        declined: 'Refusée',
        duplicate: 'Doublon',
        test_entry: 'Entrée de test',
        other: 'Autre',
      },
      deleted: 'Inscription supprimée',
      view: 'Voir l’inscription',
      gone: 'Cette inscription n’existe plus',
    },
    eventManager: {
      label: 'Accès',
      reasons: {
        account_deleted: 'Compte supprimé',
      },
      fields: {
        role: 'Rôle',
        expiresAt: 'Expire le',
      },
      values: {
        role: {
          DIRECTOR: 'Direction',
          COORDINATOR: 'Coordination',
          TREASURER: 'Trésorerie',
          COUNSELOR: 'Encadrement',
          VIEWER: 'Lecture seule',
        },
      },
    },
    message: {
      label: 'Message',
      fields: {
        recipients: 'Destinataires',
      },
      actions: {
        sent: 'Envoyé',
      },
      view: 'Voir le message',
      gone: 'Ce message n’existe plus',
    },
    expense: {
      label: 'Dépense',
      fields: {
        type: 'Type',
        amount: 'Montant',
        originalAmount: "Montant d'origine",
        originalCurrency: "Devise d'origine",
        date: 'Date',
        description: 'Description',
        categoryId: 'Catégorie',
        paidByUserId: 'Payé par',
        paidByName: 'Payé par (nom)',
        files: 'Fichiers des justificatifs',
        receiptNumber: 'Numéro de justificatif',
      },
      values: {
        type: {
          EXPENSE: 'Dépense',
          REFUND: 'Remboursement',
        },
      },
    },
    expenseCategory: {
      label: 'Catégorie de dépense',
      fields: {
        name: 'Nom',
        parentId: 'Groupe',
        position: 'Position',
        archivedAt: 'Archivée',
      },
    },
    payout: {
      label: 'Versement',
      actions: {
        signed: 'Signé',
        unsigned: 'Signature retirée',
      },
      fields: {
        recipientUserId: 'Bénéficiaire',
        recipientName: 'Bénéficiaire (nom)',
        direction: 'Sens',
        amount: 'Montant',
        note: 'Note',
        number: 'Numéro',
        paidOn: 'Payé le',
        signedAt: 'Signé',
      },
      values: {
        direction: {
          OUT: 'Versé',
          IN: 'Rendu',
        },
      },
    },
    messageTemplate: {
      label: 'E-mail automatique',
      fields: {
        trigger: 'Déclencheur',
        group: 'Groupe',
        subject: 'Objet',
        body: 'Contenu',
        priority: 'Priorité',
        replyTo: 'Adresse de réponse',
        attachments: 'Pièces jointes',
      },
      values: {
        trigger: {
          registration_submitted: 'Inscription soumise',
          registration_confirmed: 'Inscription confirmée',
          registration_waitlisted: 'Inscription en liste d’attente',
          registration_waitlist_accepted:
            'Inscription acceptée depuis la liste d’attente',
          registration_updated: 'Inscription mise à jour',
          registration_canceled: 'Inscription annulée',
        },
      },
    },
  },
};
