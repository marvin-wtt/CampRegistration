export default {
  email: {
    invitation: {
      subject: 'Zaproszenie do zarządzania wydarzeniem',
      preview: 'Pomóż w zarządzaniu wydarzeniem {{ event.name }}',
      text: {
        title: 'Zaproszenie do zarządzania {{ event.name }}',
        information:
          'Jeśli masz już konto, wydarzenie już na Ciebie czeka. ' +
          'W przeciwnym razie najpierw załóż bezpłatne konto.',
        button: 'Otwórz wydarzenie',
      },
      footer: {
        cause: '$t(email:footer.cause) zaprosił Cię inny użytkownik.',
      },
    },
  },
};
