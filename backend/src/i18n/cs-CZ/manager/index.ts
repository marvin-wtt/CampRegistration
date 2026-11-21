export default {
  email: {
    invitation: {
      subject: 'Pozvánka ke správě akce',
      preview: 'Pomoz se správou akce {{ event.name }}',
      text: {
        title: 'Pozvánka ke správě akce {{ event.name }}',
        information:
          'Pokud už máš účet, akce na tebe čeká. ' +
          'Jinak si nejdřív založ bezplatný účet.',
        button: 'Otevřít akci',
      },
      footer: {
        cause: '$t(email:footer.cause) tě pozval jiný uživatel.',
      },
    },
  },
};
