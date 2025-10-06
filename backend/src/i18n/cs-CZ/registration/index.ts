export default {
  email: {
    managerNotification: {
      subject: 'Nová registrace',
      preview: 'Nová registrace na tábor: {{ camp.name }}',
      text: {
        title: 'Dobrý den,',
        information:
          '{{ registration.firstName }} {{ registration.lastName }} se přihlásil(a) na tábor {{ camp.name }}.',
        button: 'Zobrazit registrace',
        greeting: 'S pozdravem,',
        teamName: 'Tým $t(appName)',
      },
      footer: {
        cause: '$t(email:footer.cause) jste kontaktní osobou pro tento tábor.',
      },
    },
  },
};
