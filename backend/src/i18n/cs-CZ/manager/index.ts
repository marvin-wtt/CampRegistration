export default {
  email: {
    invitation: {
      subject: 'Pozvánka do tábora',
      preview: 'Byli jste pozváni ke správě tábora {{ camp.name }}',
      text: {
        title: 'Dobrý den,',
        information:
          'Byli jste pozváni ke správě tábora {{ camp.name }}. ' +
          'Pokud již máte účet, tábor bude automaticky zpřístupněn. ' +
          'V opačném případě si nejprve vytvořte bezplatný účet.',
        button: 'Spravovat tábor',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) vás pozval jiný uživatel.',
      },
    },
  },
};
