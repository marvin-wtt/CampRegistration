export default {
  email: {
    invitation: {
      subject: 'Zaproszenie do obozu',
      preview:
        'Zostałeś(-aś) zaproszony(-a) do zarządzania obozem {{ camp.name }}',
      text: {
        title: 'Cześć,',
        information:
          'Zostałeś(-aś) zaproszony(-a) do zarządzania obozem {{ camp.name }}. ' +
          'Jeśli masz już konto, obóz będzie automatycznie dostępny. ' +
          'W przeciwnym razie utwórz najpierw bezpłatne konto.',
        button: 'Zarządzaj obozem',
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
