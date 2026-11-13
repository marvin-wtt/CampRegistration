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
  expenseCategory: {
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
    fetch: { error: 'Nie udało się pobrać finansów' },
    updateSettings: {
      success: 'Ustawienia zapisane',
      error: 'Nie udało się zapisać ustawień',
    },
  },
};
