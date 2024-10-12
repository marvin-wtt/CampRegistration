export default {
  email: {
    invitation: {
      subject: 'Camp Invitation',
      preview: 'You have been invited to manage {{ camp.name }}',
      text: {
        title: 'Hello,',
        information:
          'You have been invited to manage {{ camp.name }}. ' +
          'If you already have an account, the camp will be available automatically. ' +
          'Otherwise, please create a free account first.',
        button: 'Manage Camp',
        greeting: 'Best regards,',
        teamName: '$t(appName) team',
      },
      footer: {
        cause: '$t(email:footer.cause) you were invited by another user.',
      },
    },
  },
};
