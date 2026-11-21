export default {
  email: {
    subject: 'New Feedback',
    preview: 'New feedback received: {{ message }}',
    text: {
      title: 'New Feedback',
      replyNote:
        'Reply to this email to reach the sender directly, if they left an address.',
      senderLabel: 'From',
      messageLabel: 'Message',
    },
    footer: {
      cause: '$t(email:footer.cause) you are an administrator.',
    },
  },
};
