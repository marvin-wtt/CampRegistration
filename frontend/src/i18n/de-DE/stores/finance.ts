export default {
  expense: {
    fetch: { error: 'Fehler beim Abrufen der Ausgaben' },
    create: { error: 'Fehler beim Speichern der Ausgabe' },
    update: { error: 'Fehler beim Aktualisieren der Ausgabe' },
    delete: {
      success: 'Ausgabe gelöscht',
      error: 'Fehler beim Löschen der Ausgabe',
    },
  },
  payout: {
    unsign: {
      success: 'Unterschrift entfernt',
      error: 'Unterschrift konnte nicht entfernt werden',
    },
    sign: {
      success: 'Unterschrieben',
      error: 'Fehler beim Speichern der Unterschrift',
    },
    fetch: { error: 'Fehler beim Abrufen der Auszahlungen' },
    create: {
      success: 'Auszahlung erfasst',
      error: 'Fehler beim Erfassen der Auszahlung',
    },
    update: { error: 'Fehler beim Aktualisieren der Auszahlung' },
    delete: {
      success: 'Auszahlung rückgängig gemacht',
      error: 'Fehler beim Rückgängigmachen der Auszahlung',
    },
  },
  income: {
    fetch: { error: 'Einnahmen konnten nicht geladen werden' },
    create: {
      success: 'Einnahme erfasst',
      error: 'Einnahme konnte nicht erfasst werden',
    },
    update: { error: 'Einnahme konnte nicht geändert werden' },
    delete: {
      success: 'Einnahme gelöscht',
      error: 'Einnahme konnte nicht gelöscht werden',
    },
  },
  financeCategory: {
    fetch: { error: 'Fehler beim Abrufen der Kategorien' },
    create: { error: 'Fehler beim Erstellen der Kategorie' },
    update: { error: 'Fehler beim Aktualisieren der Kategorie' },
    order: { error: 'Fehler beim Sortieren der Kategorien' },
    delete: { error: 'Fehler beim Löschen der Kategorie' },
  },
  finance: {
    download: { error: 'Fehler beim Herunterladen des Exports' },
    downloadReceipts: {
      progress: 'Belegdateien werden vorbereitet...',
      success: 'Belegdateien heruntergeladen',
      error: 'Fehler beim Herunterladen der Belegdateien',
    },
    uploadScan: {
      error: 'Fehler beim Hochladen der unterschriebenen Erklärung',
    },
    fetch: { error: 'Fehler beim Abrufen der Finanzen' },
    updateSettings: {
      success: 'Einstellungen gespeichert',
      error: 'Fehler beim Speichern der Einstellungen',
    },
    linkParty: {
      success: 'Dem Konto zugeordnet',
      error: 'Zuordnen fehlgeschlagen',
    },
  },
  fee: {
    fetch: { error: 'Fehler beim Abrufen der Teilnahmebeiträge' },
    record: {
      success: 'Zahlung erfasst',
      error: 'Fehler beim Erfassen der Zahlung',
    },
    amountDue: {
      success: 'Betrag gespeichert',
      error: 'Fehler beim Speichern des Betrags',
    },
    updatePayment: { error: 'Fehler beim Aktualisieren der Zahlung' },
    deletePayment: {
      success: 'Zahlung gelöscht',
      error: 'Fehler beim Löschen der Zahlung',
    },
    refund: {
      success: 'Erstattung erfasst',
      error: 'Fehler beim Erfassen der Erstattung',
    },
    deleteRefund: {
      success: 'Erstattung gelöscht',
      error: 'Fehler beim Löschen der Erstattung',
    },
  },
};
