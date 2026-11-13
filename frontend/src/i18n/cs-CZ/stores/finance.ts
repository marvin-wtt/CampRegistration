export default {
  expense: {
    fetch: { error: 'Načtení výdajů se nezdařilo' },
    create: { error: 'Uložení výdaje se nezdařilo' },
    update: { error: 'Úprava výdaje se nezdařila' },
    delete: {
      success: 'Výdaj smazán',
      error: 'Smazání výdaje se nezdařilo',
    },
  },
  payout: {
    unsign: {
      success: 'Podpis odebrán',
      error: 'Podpis se nepodařilo odebrat',
    },
    sign: { success: 'Podepsáno', error: 'Uložení podpisu se nezdařilo' },
    fetch: { error: 'Načtení výplat se nezdařilo' },
    create: {
      success: 'Výplata zaznamenána',
      error: 'Zaznamenání výplaty se nezdařilo',
    },
    update: { error: 'Úprava výplaty se nezdařila' },
    delete: {
      success: 'Výplata zrušena',
      error: 'Zrušení výplaty se nezdařilo',
    },
  },
  expenseCategory: {
    fetch: { error: 'Načtení kategorií se nezdařilo' },
    create: { error: 'Vytvoření kategorie se nezdařilo' },
    update: { error: 'Úprava kategorie se nezdařila' },
    order: { error: 'Seřazení kategorií se nezdařilo' },
    delete: { error: 'Smazání kategorie se nezdařilo' },
  },
  finance: {
    download: { error: 'Stažení exportu se nezdařilo' },
    downloadReceipts: {
      progress: 'Připravují se soubory dokladů...',
      success: 'Soubory dokladů staženy',
      error: 'Stažení souborů dokladů se nezdařilo',
    },
    fetch: { error: 'Načtení financí se nezdařilo' },
    updateSettings: {
      success: 'Nastavení uloženo',
      error: 'Uložení nastavení se nezdařilo',
    },
  },
};
