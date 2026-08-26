export default {
  email: {
    reason:
      '$t(email:footer.cause) protože jste se zaregistrovali na tuto akci.',
    privacyLink: 'Informace o ochraně osobních údajů pro tuto akci',
    changes: {
      cleared: 'odstraněno',
      file: 'soubor aktualizován',
    },
    managerNotification: {
      subject: 'Nová registrace | {{ event.name }}',
      preview: 'Nová registrace na akci: {{ event.name }}',
      text: {
        title: 'Dobrý den,',
        information:
          '{{ registration.firstName }} {{ registration.lastName }} se přihlásil(a) na akci {{ event.name }}.',
        button: 'Zobrazit registrace',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) jste kontaktní osobou pro tuto akci.',
      },
    },
  },
};
