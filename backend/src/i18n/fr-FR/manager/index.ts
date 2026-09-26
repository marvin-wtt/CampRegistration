export default {
  email: {
    invitation: {
      subject: "Invitation à l'événement",
      preview: 'Tu as été invité à gérer {{ event.name }}',
      text: {
        title: 'Salut,',
        information:
          'Tu as été invité à gérer {{ event.name }}. ' +
          "Si tu possèdes déjà un compte, l'événement sera disponible automatiquement. " +
          "Sinon, crée d'abord un compte gratuit.",
        button: "Gérer l'événement",
        greeting: 'Bien à toi,',
        teamName: 'Équipe {{ appName }}',
      },
      footer: {
        cause:
          '$t(email:footer.cause) Tu as été invité par un autre utilisateur.',
      },
    },
  },
};
