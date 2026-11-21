export default {
  email: {
    confirmation: {
      subject: 'Potvrď prosím odběr newsletteru',
      preview: '{{ organization }} ti chce posílat svůj newsletter.',
      text: {
        title: 'Ahoj,',
        information:
          '{{ organization }} tě chce přidat do newsletteru „{{ newsletter }}“. Potvrď prosím, že ho chceš dostávat. Dokud nepotvrdíš, nebudeš ho dostávat.',
        button: 'Potvrdit odběr',
        accidental:
          'Pokud jsi tento e-mail nečekal/a, jednoduše ho ignoruj. Nebudeš přihlášen/a a tvoje adresa bude po 30 dnech smazána.',
        greeting: 'S pozdravem',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause:
          '$t(email:footer.cause) tě {{ organization }} přidal/a do svého newsletteru.',
      },
    },
    reason:
      '$t(email:footer.cause) jste se přihlásili k odběru našeho newsletteru.',
    unsubscribe: 'Odhlásit se',
  },
};
