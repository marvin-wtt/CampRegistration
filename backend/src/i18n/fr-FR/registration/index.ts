export default {
  email: {
    reason: '$t(email:footer.cause) vous êtes inscrit à cet événement.',
    privacyLink:
      'Informations sur la protection des données pour cet événement',
    changes: {
      cleared: 'supprimé',
      file: 'fichier mis à jour',
    },
    managerNotification: {
      subject: 'Nouvelle inscription | {{ event.name }}',
      preview: "Nouvelle inscription pour l'événement : {{ event.name }}",
      text: {
        title: 'Salut,',
        information:
          "{{ registration.firstName }} {{ registration.lastName }} s'est inscrit pour {{ event.name }}.",
        button: 'Voir les inscriptions',
        greeting: 'Cordialement,',
        teamName: 'Équipe {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) tu es un contact de cet événement.',
      },
    },
  },
};
