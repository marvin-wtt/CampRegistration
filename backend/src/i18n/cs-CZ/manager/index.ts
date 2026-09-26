export default {
  email: {
    invitation: {
      subject: 'Pozvánka na akci',
      preview: 'Byli jste pozváni ke správě akce {{ event.name }}',
      text: {
        title: 'Dobrý den,',
        information:
          'Byli jste pozváni ke správě akce {{ event.name }}. ' +
          'Pokud již máte účet, akce bude automaticky zpřístupněna. ' +
          'V opačném případě si nejprve vytvořte bezplatný účet.',
        button: 'Spravovat akci',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) vás pozval jiný uživatel.',
      },
    },
  },
};
