export default {
  email: {
    reviewPending: {
      subject: 'Organizace čeká na kontrolu: {{ organization.name }}',
      preview: '{{ organization.name }} čeká na ověření',
      text: {
        title: 'Nová organizace ke kontrole',
        information:
          '{{ organization.name }} čeká na ověření. ' +
          'Do té doby nemůže zveřejňovat akce ani posílat newslettery.',
        button: 'Zkontrolovat organizaci',
      },
      footer: {
        cause: '$t(email:footer.cause) jsi správce.',
      },
    },
    verified: {
      subject: 'Tvoje organizace je ověřená',
      preview: '{{ organization.name }} teď může zveřejňovat akce',
      text: {
        title: '{{ organization.name }} je ověřená',
        information:
          'Dobrá zpráva: teď můžeš zveřejňovat akce a posílat newslettery.',
        button: 'Otevřít organizaci',
      },
      footer: {
        cause: '$t(email:footer.cause) spravuješ tuto organizaci.',
      },
    },
    rejected: {
      subject: 'Tvou organizaci se nepodařilo ověřit',
      preview: '{{ organization.name }} potřebuje tvou pozornost',
      text: {
        title: '{{ organization.name }} se nepodařilo ověřit',
        information:
          'Dokud nebude ověřená, nemůže zveřejňovat akce ani posílat newslettery. ' +
          'Aktualizuj její údaje a znovu ji zkontrolujeme.',
        reasonLabel: 'Důvod',
        button: 'Aktualizovat údaje',
      },
      footer: {
        cause: '$t(email:footer.cause) spravuješ tuto organizaci.',
      },
    },
  },
};
