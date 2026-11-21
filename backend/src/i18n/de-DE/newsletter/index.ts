export default {
  email: {
    confirmation: {
      subject: 'Bitte bestätige dein Newsletter-Abonnement',
      preview: '{{ organization }} möchte dir einen Newsletter schicken.',
      text: {
        title: 'Hallo,',
        information:
          '{{ organization }} möchte dich in den Newsletter „{{ newsletter }}“ aufnehmen. Bitte bestätige, dass du ihn erhalten möchtest. Bis dahin bekommst du ihn nicht.',
        button: 'Abonnement bestätigen',
        accidental:
          'Wenn du diese E-Mail nicht erwartet hast, ignoriere sie einfach. Du wirst nicht eingetragen und deine Adresse wird nach 30 Tagen gelöscht.',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause:
          '$t(email:footer.cause) {{ organization }} dich zu ihrem Newsletter hinzugefügt hat.',
      },
    },
    reason: '$t(email:footer.cause) Sie unseren Newsletter abonniert haben.',
    unsubscribe: 'Abmelden',
  },
};
