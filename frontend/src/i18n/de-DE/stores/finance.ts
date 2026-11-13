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
  expenseCategory: {
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
    fetch: { error: 'Fehler beim Abrufen der Finanzen' },
    updateSettings: {
      success: 'Einstellungen gespeichert',
      error: 'Fehler beim Speichern der Einstellungen',
    },
  },
};
