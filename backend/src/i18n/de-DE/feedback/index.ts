export default {
  email: {
    subject: 'Neues Feedback',
    preview: 'Neues Feedback erhalten: {{ message }}',
    text: {
      title: 'Neues Feedback',
      replyNote:
        'Sie können auf diese E-Mail antworten, um den Benutzer direkt zu kontaktieren, falls er eine E-Mail-Adresse angegeben hat.',
      messageLabel: 'Nachricht',
      locationLabel: 'Seite',
      userAgentLabel: 'Browser',
    },
    footer: {
      cause: '$t(email:footer.cause) Sie Administrator sind.',
    },
  },
};
