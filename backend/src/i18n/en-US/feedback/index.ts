export default {
  email: {
    subject: 'New Feedback',
    preview: 'New feedback received: {{ message }}',
    text: {
      title: 'New Feedback',
      replyNote:
        'You can reply to this email to contact the user directly if they provided an email address.',
      messageLabel: 'Message',
      locationLabel: 'Location',
      userAgentLabel: 'User Agent',
    },
    footer: {
      cause: '$t(email:footer.cause) you are an administrator.',
    },
  },
};
