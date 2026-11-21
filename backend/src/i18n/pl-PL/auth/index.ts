export default {
  email: {
    resetPassword: {
      subject: 'Zresetuj hasło',
      preview: 'Ustaw nowe hasło, aby odzyskać dostęp do konta.',
      text: {
        title: 'Zresetuj hasło',
        information:
          'Nie pamiętasz hasła? Nic nie szkodzi. Ustaw nowe za pomocą przycisku poniżej.',
        button: 'Ustaw nowe hasło',
        accidental:
          'To nie Ty? Po prostu zignoruj tę wiadomość. Twoje hasło pozostanie bez zmian.',
      },
      footer: {
        cause:
          '$t(email:footer.cause) poproszono o nowe hasło do Twojego konta.',
      },
    },

    verifyEmail: {
      subject: 'Potwierdź swój adres e-mail',
      preview: 'Jedno kliknięcie i Twoje konto jest gotowe.',
      text: {
        title: 'Potwierdź swój adres e-mail',
        information:
          'Ostatni krok: potwierdź, że ten adres należy do Ciebie. Zaraz potem możesz się zalogować.',
        button: 'Potwierdź adres e-mail',
        accidental: 'Nie zakładasz konta? Po prostu zignoruj tę wiadomość.',
      },
      footer: {
        cause: '$t(email:footer.cause) utworzono konto z tym adresem.',
      },
    },
  },
};
