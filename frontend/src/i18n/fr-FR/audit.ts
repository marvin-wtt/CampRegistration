export default {
  actions: {
    created: 'Créé',
    updated: 'Modifié',
    deleted: 'Supprimé',
  },
  reason: 'Motif',
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
        form: 'Formulaire d’inscription',
        retentionReminderSentAt: 'Rappel de conservation envoyé le',
      },
    },
    registration: {
      label: 'Inscription',
      fields: {
        data: 'Réponse du formulaire',
        customData: 'Champ personnalisé',
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
      actions: {
        accepted: 'Accepté',
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
