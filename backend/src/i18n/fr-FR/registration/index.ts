export default {
  email: {
    managerNotification: {
      subject: "Notification d'inscription",
      preview: 'Nouvelle inscription pour le camp : {{ camp.name }}',
      text: {
        title: 'Salut,',
        information:
          "{{ registration.firstName }} {{ registration.lastName }} s'est inscrit pour {{ camp.name }}.",
        button: 'Voir les inscriptions',
        greeting: 'Cordialement,',
        teamName: 'Équipe $t(appName)',
      },
      footer: {
        cause: '$t(email:footer.cause) tu es un contact de ce camp.',
      },
    },
  },
};
