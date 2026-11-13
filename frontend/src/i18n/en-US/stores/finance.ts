export default {
  expense: {
    fetch: { error: 'Failed to fetch expenses' },
    create: { error: 'Failed to save the expense' },
    update: { error: 'Failed to update the expense' },
    delete: {
      success: 'Expense deleted',
      error: 'Failed to delete the expense',
    },
  },
  payout: {
    unsign: {
      success: 'Signature removed',
      error: 'Failed to remove the signature',
    },
    sign: { success: 'Signed', error: 'Failed to save the signature' },
    fetch: { error: 'Failed to fetch payouts' },
    create: {
      success: 'Payout recorded',
      error: 'Failed to record the payout',
    },
    update: { error: 'Failed to update the payout' },
    delete: { success: 'Payout undone', error: 'Failed to undo the payout' },
  },
  expenseCategory: {
    fetch: { error: 'Failed to fetch categories' },
    create: { error: 'Failed to create the category' },
    update: { error: 'Failed to update the category' },
    order: { error: 'Failed to reorder the categories' },
    delete: { error: 'Failed to delete the category' },
  },
  finance: {
    download: { error: 'Failed to download the export' },
    downloadReceipts: {
      progress: 'Preparing the receipt files...',
      success: 'Receipt files downloaded',
      error: 'Failed to download the receipt files',
    },
    fetch: { error: 'Failed to fetch the finances' },
    updateSettings: {
      success: 'Settings saved',
      error: 'Failed to save the settings',
    },
  },
};
