export default {
  email: {
    confirmation: {
      subject: 'Bestätige deine Newsletter-Anmeldung',
      preview: 'Ein Klick und du erhältst „{{ newsletter }}“.',
      text: {
        title: 'Newsletter-Anmeldung bestätigen',
        information:
          '{{ organization }} möchte dich in den Newsletter „{{ newsletter }}“ aufnehmen. Bestätige deine Anmeldung, um künftig Neuigkeiten und Informationen per E-Mail zu erhalten.',
        button: 'Anmeldung bestätigen',
        accidental:
          'Du hast dich nicht angemeldet? Dann ignoriere diese E-Mail einfach. Du wirst nicht aufgenommen und deine Adresse wird nach 30 Tagen gelöscht.',
      },
      footer: {
        cause:
          '$t(email:footer.cause) {{ organization }} dich zu ihrem Newsletter hinzugefügt hat.',
      },
    },
    reason: '$t(email:footer.cause) du diesen Newsletter abonniert hast.',
    unsubscribe: 'Abmelden',
  },
};
