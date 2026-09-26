export default {
  email: {
    reviewPending: {
      subject: 'Organizace čeká na kontrolu: {{ organization.name }}',
      preview: '{{ organization.name }} čeká na ověření',
      text: {
        title: 'Nová organizace vyžaduje kontrolu',
        information:
          '{{ organization.name }} byla odeslána k ověření. ' +
          'Než bude ověřena, nemůže zveřejňovat akce ani posílat newslettery.',
        button: 'Zkontrolovat organizace',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) jsi správce.',
      },
    },
    verified: {
      subject: 'Tvoje organizace byla ověřena',
      preview: '{{ organization.name }} může nyní zveřejňovat akce',
      text: {
        title: 'Tvoje organizace byla ověřena',
        information:
          '{{ organization.name }} byla ověřena. ' +
          'Nyní můžeš zveřejňovat její akce a posílat newslettery.',
        button: 'Otevřít organizaci',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) spravuješ tuto organizaci.',
      },
    },
    rejected: {
      subject: 'Tvoji organizaci se nepodařilo ověřit',
      preview: '{{ organization.name }} vyžaduje tvoji pozornost',
      text: {
        title: 'Tvoji organizaci se nepodařilo ověřit',
        information:
          '{{ organization.name }} nebyla ověřena. ' +
          'Do té doby nemůže zveřejňovat akce ani posílat newslettery. ' +
          'Oprava registrovaných údajů ji vrátí zpět k ověření.',
        reasonLabel: 'Důvod',
        button: 'Zkontrolovat údaje',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) spravuješ tuto organizaci.',
      },
    },
  },
};
