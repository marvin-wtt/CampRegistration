export default {
  email: {
    reason: '$t(email:footer.cause) vous êtes inscrit à ce camp.',
    managerNotification: {
      subject: 'Nouvelle inscription | {{ camp.name }}',
      preview: 'Nouvelle inscription pour le camp : {{ camp.name }}',
      text: {
        title: 'Salut,',
        information:
          "{{ registration.firstName }} {{ registration.lastName }} s'est inscrit pour {{ camp.name }}.",
        button: 'Voir les inscriptions',
        greeting: 'Cordialement,',
        teamName: 'Équipe {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) tu es un contact de ce camp.',
      },
    },
  },
};
