export default {
  email: {
    reason: '$t(email:footer.cause) tu t’es inscrit(e) à cet événement.',
    privacyLink:
      'Informations sur la protection des données pour cet événement',
    changes: {
      cleared: 'supprimé',
      file: 'fichier mis à jour',
    },
    managerNotification: {
      subject: 'Nouvelle inscription | {{ event.name }}',
      preview: 'Nouvelle inscription pour {{ event.name }}',
      text: {
        title: 'Nouvelle inscription',
        information:
          '{{ registration.firstName }} {{ registration.lastName }} vient de s’inscrire à {{ event.name }}.',
        button: 'Voir les inscriptions',
      },
      footer: {
        cause: '$t(email:footer.cause) tu es un contact de cet événement.',
      },
    },
    messageBounced: {
      subject: 'Message non distribué | {{ event.name }}',
      preview:
        'Un message à {{ recipient }} n’a pas pu être distribué pour {{ event.name }}',
      text: {
        title: 'Ton message n’a pas été distribué',
        information:
          '« {{ messageSubject }} » à {{ recipient }} pour {{ event.name }} n’a pas pu être distribué. Vérifie l’adresse e-mail de cette inscription.',
        button: 'Voir les inscriptions',
      },
      footer: {
        cause: '$t(email:footer.cause) tu es un contact de cet événement.',
      },
    },
  },
};
