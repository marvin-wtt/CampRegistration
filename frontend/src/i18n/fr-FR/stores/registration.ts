export default {
  fetch: {
    error: 'Échec de récupération des inscriptions',
  },
  create: {
    progress: "Création de l'inscription en cours...",
    success: 'Inscription créée avec succès',
    error: "Échec de création de l'inscription",
    invalid: "ID d'événement invalide",
  },
  update: {
    progress: "Mise à jour de l'inscription en cours...",
    success: 'Inscription mise à jour avec succès',
    error: "Échec de mise à jour de l'inscription",
    invalid: "ID d'inscription ou d'événement invalide",
  },
  delete: {
    progress: "Suppression de l'inscription en cours...",
    success: 'Inscription supprimée avec succès',
    error: "Échec de suppression de l'inscription",
    invalid: "ID d'inscription ou d'événement invalide",
  },
  realtimeCreate: {
    message: 'Nouvelle inscription reçue',
    caption: '{name} vient de s’inscrire.',
    fallbackName: 'Quelqu’un',
  },
};
