export default {
  email: {
    subject: 'Nová zpětná vazba',
    preview: 'Přijata nová zpětná vazba: {{ message }}',
    text: {
      title: 'Nová zpětná vazba',
      replyNote:
        'Odpověz na tento e-mail a ozvi se přímo odesílateli, pokud zanechal adresu.',
      senderLabel: 'Od',
      messageLabel: 'Zpráva',
    },
    footer: {
      cause: '$t(email:footer.cause) jsi správce.',
    },
  },
};
