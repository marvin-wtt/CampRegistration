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
          DIRECTOR: 'Directeur',
          COORDINATOR: 'Coordinateur',
          COUNSELOR: 'Conseiller',
          VIEWER: 'Lecteur',
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
    messageTemplate: {
      label: 'E-mail automatique',
      fields: {
        trigger: 'Déclencheur',
        country: 'Pays',
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
