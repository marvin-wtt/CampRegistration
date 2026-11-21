export default {
  email: {
    invitation: {
      subject: 'You’re invited to manage an event',
      preview: 'Help manage {{ event.name }}',
      text: {
        title: 'You’re invited to manage {{ event.name }}',
        information:
          'If you already have an account, the event is waiting for you. ' +
          'Otherwise, create a free account first.',
        button: 'Open event',
      },
      footer: {
        cause: '$t(email:footer.cause) you were invited by another user.',
      },
    },
  },
};
