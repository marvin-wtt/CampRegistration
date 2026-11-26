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
  income: {
    fetch: { error: 'Impossible de charger les recettes' },
    create: {
      success: 'Recette enregistrée',
      error: 'Impossible d’enregistrer la recette',
    },
    update: { error: 'Impossible de modifier la recette' },
    delete: {
      success: 'Recette supprimée',
      error: 'Impossible de supprimer la recette',
    },
  },
  financeCategory: {
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
    uploadScan: { error: 'Échec de l’import de la déclaration signée' },
    fetch: { error: 'Échec du chargement des finances' },
    updateSettings: {
      success: 'Paramètres enregistrés',
      error: "Échec de l'enregistrement des paramètres",
    },
    linkParty: {
      success: 'Rattaché au compte',
      error: 'Échec du rattachement',
    },
  },
  fee: {
    fetch: { error: "Échec du chargement des frais d'inscription" },
    record: {
      success: 'Paiement enregistré',
      error: "Échec de l'enregistrement du paiement",
    },
    amountDue: {
      success: 'Montant dû enregistré',
      error: "Échec de l'enregistrement du montant dû",
    },
    updatePayment: { error: 'Échec de la mise à jour du paiement' },
    deletePayment: {
      success: 'Paiement supprimé',
      error: 'Échec de la suppression du paiement',
    },
    refund: {
      success: 'Remboursement enregistré',
      error: "Échec de l'enregistrement du remboursement",
    },
    deleteRefund: {
      success: 'Remboursement supprimé',
      error: 'Échec de la suppression du remboursement',
    },
  },
};
