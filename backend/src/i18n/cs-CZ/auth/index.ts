export default {
  email: {
    resetPassword: {
      subject: 'Obnovení hesla',
      preview: 'Obnovte nyní své heslo a získejte znovu přístup.',
      text: {
        title: 'Dobrý den,',
        information:
          'Zapomněli jste své heslo? Žádný problém. Zde si můžete nastavit nové.',
        button: 'Obnovit heslo',
        accidental:
          'Pokud jste nepožádali o obnovení hesla, tuto e-mailovou zprávu ignorujte.',
        greeting: 'S pozdravem,',
        teamName: 'Tým $t(appName)',
      },
      footer: {
        cause: '$t(email:footer.cause) požádali jste o nové heslo.',
      },
    },

    verifyEmail: {
      subject: 'Potvrďte svou e-mailovou adresu',
      preview: 'Potvrďte e-mail a aktivujte svůj účet.',
      text: {
        title: 'Dobrý den,',
        information:
          'Potvrďte prosím svou e-mailovou adresu, abychom ověřili, že je účet váš. Po potvrzení se můžete ihned přihlásit.',
        button: 'Potvrdit e-mail',
        accidental:
          'Pokud jste si účet nevytvořili, na odkaz neklikejte a kontaktujte nás.',
        greeting: 'S pozdravem,',
        teamName: 'Tým $t(appName)',
      },
      footer: {
        cause: '$t(email:footer.cause) vytvořili jste účet.',
      },
    },
  },
};
