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
  income: {
    fetch: { error: 'Failed to fetch the income' },
    create: {
      success: 'Income recorded',
      error: 'Failed to record the income',
    },
    update: { error: 'Failed to update the income' },
    delete: { success: 'Income deleted', error: 'Failed to delete the income' },
  },
  financeCategory: {
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
    uploadScan: { error: 'Failed to upload the signed slip' },
    fetch: { error: 'Failed to fetch the finances' },
    updateSettings: {
      success: 'Settings saved',
      error: 'Failed to save the settings',
    },
    linkParty: {
      success: 'Moved to the account',
      error: 'Failed to move the records',
    },
  },
  fee: {
    fetch: { error: 'Failed to fetch the registration fees' },
    record: {
      success: 'Payment recorded',
      error: 'Failed to record the payment',
    },
    amountDue: {
      success: 'Amount due saved',
      error: 'Failed to save the amount due',
    },
    updatePayment: { error: 'Failed to update the payment' },
    deletePayment: {
      success: 'Payment deleted',
      error: 'Failed to delete the payment',
    },
    refund: {
      success: 'Refund recorded',
      error: 'Failed to record the refund',
    },
    deleteRefund: {
      success: 'Refund deleted',
      error: 'Failed to delete the refund',
    },
  },
};
