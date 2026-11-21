export default {
  email: {
    resetPassword: {
      subject: 'Setze dein Passwort zurück',
      preview: 'Wähle ein neues Passwort, um wieder Zugriff zu bekommen.',
      text: {
        title: 'Setze dein Passwort zurück',
        information:
          'Passwort vergessen? Kein Problem. Wähle über den Button ein neues.',
        button: 'Neues Passwort wählen',
        accidental:
          'Du hast das nicht angefordert? Dann ignoriere diese E-Mail einfach. Dein Passwort bleibt unverändert.',
      },
      footer: {
        cause:
          '$t(email:footer.cause) für dein Konto ein neues Passwort angefordert wurde.',
      },
    },

    verifyEmail: {
      subject: 'Bestätige deine E-Mail-Adresse',
      preview: 'Ein Klick und dein Konto ist startklar.',
      text: {
        title: 'Bestätige deine E-Mail-Adresse',
        information:
          'Nur noch ein Schritt: Bestätige, dass diese Adresse dir gehört. Danach kannst du dich direkt anmelden.',
        button: 'E-Mail-Adresse bestätigen',
        accidental:
          'Du hast kein Konto erstellt? Dann ignoriere diese E-Mail einfach.',
      },
      footer: {
        cause: '$t(email:footer.cause) du ein Konto erstellt hast.',
      },
    },
  },
};
