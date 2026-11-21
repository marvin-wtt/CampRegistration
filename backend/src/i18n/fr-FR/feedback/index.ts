export default {
  email: {
    subject: 'Nouveau retour',
    preview: 'Nouveau retour reçu : {{ message }}',
    text: {
      title: 'Nouveau retour',
      replyNote:
        "Réponds à cet e-mail pour contacter directement l'auteur, s'il a laissé une adresse.",
      senderLabel: 'De',
      messageLabel: 'Message',
    },
    footer: {
      cause: '$t(email:footer.cause) tu es administrateur.',
    },
  },
};
