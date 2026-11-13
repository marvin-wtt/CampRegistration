export default {
  expense: {
    fetch: { error: 'Échec du chargement des dépenses' },
    create: { error: "Échec de l'enregistrement de la dépense" },
    update: { error: 'Échec de la mise à jour de la dépense' },
    delete: {
      success: 'Dépense supprimée',
      error: 'Échec de la suppression de la dépense',
    },
  },
  payout: {
    unsign: {
      success: 'Signature retirée',
      error: 'Impossible de retirer la signature',
    },
    sign: {
      success: 'Signé',
      error: "Échec de l'enregistrement de la signature",
    },
    fetch: { error: 'Échec du chargement des versements' },
    create: {
      success: 'Versement enregistré',
      error: "Échec de l'enregistrement du versement",
    },
    update: { error: 'Échec de la mise à jour du versement' },
    delete: {
      success: 'Versement annulé',
      error: "Échec de l'annulation du versement",
    },
  },
  expenseCategory: {
    fetch: { error: 'Échec du chargement des catégories' },
    create: { error: 'Échec de la création de la catégorie' },
    update: { error: 'Échec de la mise à jour de la catégorie' },
    order: { error: 'Échec du tri des catégories' },
    delete: { error: 'Échec de la suppression de la catégorie' },
  },
  finance: {
    download: { error: "Échec du téléchargement de l'export" },
    downloadReceipts: {
      progress: 'Préparation des justificatifs...',
      success: 'Justificatifs téléchargés',
      error: 'Échec du téléchargement des justificatifs',
    },
    fetch: { error: 'Échec du chargement des finances' },
    updateSettings: {
      success: 'Paramètres enregistrés',
      error: "Échec de l'enregistrement des paramètres",
    },
  },
};
