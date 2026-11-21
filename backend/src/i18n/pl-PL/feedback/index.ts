export default {
  email: {
    subject: 'Nowa opinia',
    preview: 'Otrzymano nową opinię: {{ message }}',
    text: {
      title: 'Nowa opinia',
      replyNote:
        'Odpowiedz na tę wiadomość, aby skontaktować się bezpośrednio z nadawcą, jeśli zostawił adres.',
      senderLabel: 'Od',
      messageLabel: 'Wiadomość',
    },
    footer: {
      cause: '$t(email:footer.cause) jesteś administratorem.',
    },
  },
};
