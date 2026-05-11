export default {
  email: {
    resetPassword: {
      subject: 'Passwort zurücksetzen',
      preview:
        'Setzen Sie jetzt Ihr Passwort zurück, um wieder Zugriff zu erhalten.',
      text: {
        title: 'Hallo,',
        information:
          'Haben Sie Ihr Passwort vergessen? Kein Problem. Sie können hier ein neues festlegen.',
        button: 'Passwort zurücksetzen',
        accidental:
          'Wenn Sie keine Passwortrücksetzung angefordert haben, können Sie diese E-Mail ignorieren.',
        greeting: 'Viele Grüße,',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause:
          '$t(email:footer.cause) Sie ein neues Password angefordert haben.',
      },
    },

    verifyEmail: {
      subject: 'Bestätigen Sie Ihre E-Mail',
      preview: 'Bestätigen Sie Ihre E-Mail, um Ihr Konto freizuschalten.',
      text: {
        title: 'Hallo,',
        information:
          'Bitte bestätigen Sie Ihre E-Mail, um sicherzustellen, dass das Konto Ihnen gehört. Sie können sich nach der Bestätigung direkt anmelden.',
        button: 'E-Mail bestätigen',
        accidental:
          'Wenn Sie kein Konto erstellt haben, klicken Sie bitte nicht auf den Link und kontaktieren Sie uns.',
        greeting: 'Viele Grüße,',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause: '$t(email:footer.cause) Sie haben ein Konto erstellt.',
      },
    },
  },
};
