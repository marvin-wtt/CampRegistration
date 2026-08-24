export default {
  email: {
    invitation: {
      subject: 'Zaproszenie do wydarzenia',
      preview:
        'Zostałeś(-aś) zaproszony(-a) do zarządzania wydarzeniem {{ event.name }}',
      text: {
        title: 'Cześć,',
        information:
          'Zostałeś(-aś) zaproszony(-a) do zarządzania wydarzeniem {{ event.name }}. ' +
          'Jeśli masz już konto, wydarzenie będzie automatycznie dostępne. ' +
          'W przeciwnym razie utwórz najpierw bezpłatne konto.',
        button: 'Zarządzaj wydarzeniem',
        greeting: 'Pozdrawiamy,',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause:
          '$t(email:footer.cause) zostałeś(-aś) zaproszony(-a) przez innego użytkownika.',
      },
    },
  },
};
