export default {
  email: {
    reviewPending: {
      subject: 'Organisation en attente de contrôle : {{ organization.name }}',
      preview: '{{ organization.name }} attend sa vérification',
      text: {
        title: 'Une nouvelle organisation doit être contrôlée',
        information:
          '{{ organization.name }} a été soumise à vérification. ' +
          "Tant qu'elle n'est pas vérifiée, elle ne peut ni publier de events ni envoyer de newsletters.",
        button: 'Contrôler les organisations',
        greeting: 'Cordialement,',
        teamName: "L'équipe {{ appName }}",
      },
      footer: {
        cause: '$t(email:footer.cause) tu es administrateur.',
      },
    },
    verified: {
      subject: 'Ton organisation a été vérifiée',
      preview: '{{ organization.name }} peut désormais publier des events',
      text: {
        title: 'Ton organisation a été vérifiée',
        information:
          '{{ organization.name }} a été vérifiée. ' +
          'Tu peux maintenant publier ses events et envoyer des newsletters.',
        button: "Ouvrir l'organisation",
        greeting: 'Cordialement,',
        teamName: "L'équipe {{ appName }}",
      },
      footer: {
        cause: '$t(email:footer.cause) tu administres cette organisation.',
      },
    },
    rejected: {
      subject: "Ton organisation n'a pas pu être vérifiée",
      preview: '{{ organization.name }} requiert ton attention',
      text: {
        title: "Ton organisation n'a pas pu être vérifiée",
        information:
          "{{ organization.name }} n'a pas été vérifiée. " +
          "Elle ne peut ni publier de events ni envoyer de newsletters tant que ce n'est pas fait. " +
          'Corriger ses informations enregistrées la remet en attente de vérification.',
        reasonLabel: 'Motif',
        button: 'Vérifier les informations',
        greeting: 'Cordialement,',
        teamName: "L'équipe {{ appName }}",
      },
      footer: {
        cause: '$t(email:footer.cause) tu administres cette organisation.',
      },
    },
  },
};
