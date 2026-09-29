export default {
  email: {
    subject: 'Nová zpětná vazba',
    preview: 'Přijata nová zpětná vazba: {{ message }}',
    text: {
      title: 'Nová zpětná vazba',
      replyNote:
        'Na tento e-mail můžete odpovědět a přímo kontaktovat uživatele, pokud poskytl e-mailovou adresu.',
      senderLabel: 'Od',
      messageLabel: 'Zpráva',
    },
    footer: {
      cause: '$t(email:footer.cause) jste správce.',
    },
  },
};
