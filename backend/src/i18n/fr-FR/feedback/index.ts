export default {
  email: {
    subject: 'Nouveau retour',
    preview: 'Nouveau retour reçu : {{ message }}',
    text: {
      title: 'Nouveau retour',
      replyNote:
        "Vous pouvez répondre à cet e-mail pour contacter l'utilisateur directement s'il a fourni une adresse e-mail.",
      messageLabel: 'Message',
      locationLabel: 'Page',
      userAgentLabel: 'Navigateur',
    },
    footer: {
      cause: '$t(email:footer.cause) vous êtes administrateur.',
    },
  },
};
