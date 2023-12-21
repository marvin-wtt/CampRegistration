export default {
  email: {
    managerNotification: {
      subject: "Notification d'inscription",
      preview: "Nouvelle inscription pour le camp : {{ camp.name }}",
      text: {
        title: "Salut,",
        information:
          "{{ participantName }} s'est inscrit pour {{ camp.name }}.",
        button: "Voir les inscriptions",
        greeting: "Cordialement,",
        teamName: "Équipe $t(appName)",
      },
      footer: {
        cause: "$t(email:footer.cause) tu es un contact de ce camp.",
      },
    },
    waitingListConfirmation: {
      subject: "Notification liste d'attente",
      preview:
        "Notification liste d'attente pour ton inscription au camp : {{ camp.name }}",
      text: {
        title: "Salut {{ participantName }},",
        information:
          "Merci pour ton inscription au {{ camp.name }}." +
          "Malheureusement, toutes les places sont déjà prises." +
          "Ton inscription est maintenant sur liste d'attente." +
          "Nous te tiendrons informé dès qu'une place se libérera.",
        contact:
          "Si tu as d'autres questions, n'hésite pas à nous contacter en répondant à cet e-mail.",
        greeting: "Cordialement,",
        teamName: "Équipe $t(appName)",
      },
      footer: {
        cause: "$t(email:footer.cause) tu t'es inscrit pour un camp.",
      },
    },
    confirmation: {
      subject: "Confirmation d'inscription",
      preview: "Confirmation pour ton inscription au camp : {{ camp.name }}",
      text: {
        title: "Salut {{ participantName }},",
        information:
          "Merci pour ton inscription au {{ camp.name }}." +
          "Tu recevras d'autres informations dans un e-mail séparé.",
        contact:
          "Si tu as d'autres questions, n'hésite pas à nous contacter en répondant à cet e-mail.",
        greeting: "Cordialement,",
        teamName: "Équipe $t(appName)",
      },
      footer: {
        cause: "$t(email:footer.cause) tu t'es inscrit pour un camp.",
      },
    },
  },
};
