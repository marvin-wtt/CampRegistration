export default {
  email: {
    invitation: {
      subject: 'Tu es invité(e) à gérer un événement',
      preview: 'Aide à gérer {{ event.name }}',
      text: {
        title: 'Tu es invité(e) à gérer {{ event.name }}',
        information:
          'Si tu as déjà un compte, l’événement t’attend. ' +
          'Sinon, crée d’abord un compte gratuit.',
        button: 'Ouvrir l’événement',
      },
      footer: {
        cause:
          '$t(email:footer.cause) tu as été invité(e) par un autre utilisateur.',
      },
    },
  },
};
