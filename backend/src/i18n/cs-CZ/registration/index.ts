export default {
  email: {
    reason:
      '$t(email:footer.cause) protože jste se zaregistrovali na tento tábor.',
    managerNotification: {
      subject: 'Nová registrace | {{ camp.name }}',
      preview: 'Nová registrace na tábor: {{ camp.name }}',
      text: {
        title: 'Dobrý den,',
        information:
          '{{ registration.firstName }} {{ registration.lastName }} se přihlásil(a) na tábor {{ camp.name }}.',
        button: 'Zobrazit registrace',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) jste kontaktní osobou pro tento tábor.',
      },
    },
  },
};
