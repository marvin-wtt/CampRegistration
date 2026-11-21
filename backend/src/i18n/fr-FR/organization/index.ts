export default {
  email: {
    reviewPending: {
      subject:
        'Organisation en attente de vérification : {{ organization.name }}',
      preview: '{{ organization.name }} attend d’être vérifiée',
      text: {
        title: 'Nouvelle organisation à vérifier',
        information:
          '{{ organization.name }} attend sa vérification. ' +
          'D’ici là, elle ne peut ni publier d’événements ni envoyer de newsletters.',
        button: 'Vérifier l’organisation',
      },
      footer: {
        cause: '$t(email:footer.cause) tu es administrateur.',
      },
    },
    verified: {
      subject: 'Ton organisation est vérifiée',
      preview: '{{ organization.name }} peut maintenant publier des événements',
      text: {
        title: '{{ organization.name }} est vérifiée',
        information:
          'Bonne nouvelle : tu peux maintenant publier des événements et envoyer des newsletters.',
        button: 'Ouvrir l’organisation',
      },
      footer: {
        cause: '$t(email:footer.cause) tu administres cette organisation.',
      },
    },
    rejected: {
      subject: 'Ton organisation n’a pas pu être vérifiée',
      preview: '{{ organization.name }} a besoin de ton attention',
      text: {
        title: 'Nous n’avons pas pu vérifier {{ organization.name }}',
        information:
          'Tant qu’elle n’est pas vérifiée, elle ne peut ni publier d’événements ni envoyer de newsletters. ' +
          'Mets à jour ses informations et nous la vérifierons à nouveau.',
        reasonLabel: 'Motif',
        button: 'Mettre à jour les informations',
      },
      footer: {
        cause: '$t(email:footer.cause) tu administres cette organisation.',
      },
    },
  },
};
