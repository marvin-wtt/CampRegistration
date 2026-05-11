export default {
  email: {
    resetPassword: {
      subject: 'Reset hasła',
      preview: 'Zresetuj teraz hasło, aby odzyskać dostęp.',
      text: {
        title: 'Dzień dobry,',
        information:
          'Zapomniałeś(-aś) hasła? Nic nie szkodzi. Tutaj możesz ustawić nowe.',
        button: 'Zresetuj hasło',
        accidental:
          'Jeśli nie prosiłeś(-aś) o reset hasła, zignoruj tę wiadomość.',
        greeting: 'Pozdrawiamy,',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) poproszono o ustawienie nowego hasła.',
      },
    },

    verifyEmail: {
      subject: 'Potwierdź swój adres e-mail',
      preview: 'Potwierdź adres e-mail, aby odblokować konto.',
      text: {
        title: 'Dzień dobry,',
        information:
          'Potwierdź proszę swój adres e-mail, aby upewnić się, że konto należy do Ciebie. Po potwierdzeniu możesz od razu się zalogować.',
        button: 'Potwierdź e-mail',
        accidental:
          'Jeśli nie zakładałeś(-aś) konta, nie klikaj w link i skontaktuj się z nami.',
        greeting: 'Pozdrawiamy,',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) utworzono konto.',
      },
    },
  },
};
