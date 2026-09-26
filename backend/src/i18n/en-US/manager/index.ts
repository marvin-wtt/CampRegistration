export default {
  email: {
    invitation: {
      subject: 'Event Invitation',
      preview: 'You have been invited to manage {{ event.name }}',
      text: {
        title: 'Hello,',
        information:
          'You have been invited to manage {{ event.name }}. ' +
          'If you already have an account, the event will be available automatically. ' +
          'Otherwise, please create a free account first.',
        button: 'Manage Event',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) you were invited by another user.',
      },
    },
  },
};
