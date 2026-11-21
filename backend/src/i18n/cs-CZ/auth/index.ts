export default {
  email: {
    resetPassword: {
      subject: 'Obnov si heslo',
      preview: 'Nastav si nové heslo a získej zpět přístup ke svému účtu.',
      text: {
        title: 'Obnov si heslo',
        information:
          'Zapomněl(a) jsi heslo? Nevadí. Nastav si nové pomocí tlačítka níže.',
        button: 'Nastavit nové heslo',
        accidental:
          'Nežádal(a) jsi o to? Jednoduše tento e-mail ignoruj. Tvoje heslo zůstane beze změny.',
      },
      footer: {
        cause: '$t(email:footer.cause) bylo pro tvůj účet vyžádáno nové heslo.',
      },
    },

    verifyEmail: {
      subject: 'Potvrď svou e-mailovou adresu',
      preview: 'Jedno kliknutí a tvůj účet je připravený.',
      text: {
        title: 'Potvrď svou e-mailovou adresu',
        information:
          'Poslední krok: potvrď, že tato adresa patří tobě. Hned potom se můžeš přihlásit.',
        button: 'Potvrdit e-mailovou adresu',
        accidental: 'Nezakládal(a) jsi účet? Jednoduše tento e-mail ignoruj.',
      },
      footer: {
        cause: '$t(email:footer.cause) byl s touto adresou vytvořen účet.',
      },
    },
  },
};
