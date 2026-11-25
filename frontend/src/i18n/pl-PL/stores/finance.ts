export default {
  expense: {
    fetch: { error: 'Nie udało się pobrać wydatków' },
    create: { error: 'Nie udało się zapisać wydatku' },
    update: { error: 'Nie udało się zaktualizować wydatku' },
    delete: {
      success: 'Wydatek usunięty',
      error: 'Nie udało się usunąć wydatku',
    },
  },
  payout: {
    unsign: {
      success: 'Podpis usunięty',
      error: 'Nie udało się usunąć podpisu',
    },
    sign: { success: 'Podpisano', error: 'Nie udało się zapisać podpisu' },
    fetch: { error: 'Nie udało się pobrać wypłat' },
    create: {
      success: 'Wypłata zapisana',
      error: 'Nie udało się zapisać wypłaty',
    },
    update: { error: 'Nie udało się zaktualizować wypłaty' },
    delete: {
      success: 'Wypłata cofnięta',
      error: 'Nie udało się cofnąć wypłaty',
    },
  },
  income: {
    fetch: { error: 'Nie udało się pobrać przychodów' },
    create: {
      success: 'Przychód zapisany',
      error: 'Nie udało się zapisać przychodu',
    },
    update: { error: 'Nie udało się zmienić przychodu' },
    delete: {
      success: 'Przychód usunięty',
      error: 'Nie udało się usunąć przychodu',
    },
  },
  financeCategory: {
    fetch: { error: 'Nie udało się pobrać kategorii' },
    create: { error: 'Nie udało się utworzyć kategorii' },
    update: { error: 'Nie udało się zaktualizować kategorii' },
    order: { error: 'Nie udało się posortować kategorii' },
    delete: { error: 'Nie udało się usunąć kategorii' },
  },
  finance: {
    download: { error: 'Nie udało się pobrać eksportu' },
    downloadReceipts: {
      progress: 'Przygotowywanie plików paragonów...',
      success: 'Pliki paragonów pobrane',
      error: 'Nie udało się pobrać plików paragonów',
    },
    uploadScan: { error: 'Nie udało się przesłać podpisanego rozliczenia' },
    fetch: { error: 'Nie udało się pobrać finansów' },
    updateSettings: {
      success: 'Ustawienia zapisane',
      error: 'Nie udało się zapisać ustawień',
    },
    linkParty: {
      success: 'Przypisano do konta',
      error: 'Nie udało się przypisać',
    },
  },
  fee: {
    fetch: { error: 'Nie udało się pobrać opłat za udział' },
    record: {
      success: 'Płatność zarejestrowana',
      error: 'Nie udało się zarejestrować płatności',
    },
    amountDue: {
      success: 'Kwota należna zapisana',
      error: 'Nie udało się zapisać kwoty należnej',
    },
    updatePayment: { error: 'Nie udało się zaktualizować płatności' },
    deletePayment: {
      success: 'Płatność usunięta',
      error: 'Nie udało się usunąć płatności',
    },
    refund: {
      success: 'Zwrot zarejestrowany',
      error: 'Nie udało się zarejestrować zwrotu',
    },
    deleteRefund: {
      success: 'Zwrot usunięty',
      error: 'Nie udało się usunąć zwrotu',
    },
  },
};
