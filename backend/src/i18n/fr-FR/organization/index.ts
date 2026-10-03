export default {
  email: {
    reviewPending: {
      subject: 'Organisation en attente de contrôle : {{ organization.name }}',
      preview: '{{ organization.name }} attend sa vérification',
      text: {
        title: 'Une nouvelle organisation doit être contrôlée',
        information:
          '{{ organization.name }} a été soumise à vérification. ' +
          "Tant qu'elle n'est pas vérifiée, elle ne peut ni publier d'événements ni envoyer de newsletters.",
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
      preview: '{{ organization.name }} peut désormais publier des événements',
      text: {
        title: 'Ton organisation a été vérifiée',
        information:
          '{{ organization.name }} a été vérifiée. ' +
          'Tu peux maintenant publier ses événements et envoyer des newsletters.',
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
          "Elle ne peut ni publier d'événements ni envoyer de newsletters tant que ce n'est pas fait. " +
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
    priceModelOffered: {
      subject: 'Nouveaux tarifs pour {{ organization.name }}',
      preview:
        "Merci d'accepter le nouveau modèle tarifaire avant le {{ date }}",
      text: {
        title: "Merci d'accepter les nouveaux tarifs",
        information:
          "À partir du {{ date }}, {{ organization.name }} passe au modèle tarifaire {{ model.name }} : {{ model.price }} par inscription plus des frais de base de {{ model.baseFee }}, dont {{ model.taxRate }} % de taxe. Les événements déjà créés conservent leurs tarifs. Tant que tu n'as pas accepté, tu ne pourras plus créer d'événements à partir du {{ date }}. Tu peux accepter ou refuser sur la page de facturation.",
        button: 'Voir les tarifs',
        greeting: 'Cordialement,',
        teamName: "L'équipe {{ appName }}",
      },
      footer: {
        cause: '$t(email:footer.cause) tu administres cette organisation.',
      },
    },
    priceModelLowered: {
      subject: 'Tarifs réduits pour {{ organization.name }}',
      preview: '{{ organization.name }} paie désormais moins',
      text: {
        title: 'Tes tarifs ont baissé',
        information:
          "{{ organization.name }} utilise désormais le modèle tarifaire {{ model.name }} : {{ model.price }} par inscription plus des frais de base de {{ model.baseFee }}, dont {{ model.taxRate }} % de taxe. Il s'applique aux événements créés à partir de maintenant. Rien n'est plus cher, il n'y a donc rien à accepter.",
        button: 'Ouvrir la facturation',
        greeting: 'Cordialement,',
        teamName: "L'équipe {{ appName }}",
      },
      footer: {
        cause: '$t(email:footer.cause) tu administres cette organisation.',
      },
    },
    invoiceIssued: {
      subject: 'Facture pour {{ event.name }}',
      preview: '{{ amount }} pour {{ event.name }}',
      text: {
        title: 'Une nouvelle facture est disponible',
        information:
          'La facture pour {{ event.name }} est disponible : {{ amount }}. ' +
          'Tu peux la télécharger sur la page de facturation de {{ organization.name }}.',
        button: 'Ouvrir la facturation',
        greeting: 'Cordialement,',
        teamName: "L'équipe {{ appName }}",
      },
      footer: {
        cause: '$t(email:footer.cause) tu administres cette organisation.',
      },
    },
  },
};
