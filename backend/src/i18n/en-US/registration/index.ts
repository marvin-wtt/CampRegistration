export default {
  email: {
    managerNotification: {
      subject: 'Registration Notification',
      preview: 'New registration for the camp: {{ camp.name }}',
      text: {
        title: 'Hello,',
        information: '{{ participantName }} registered for {{ camp.name }}.',
        button: 'View Registrations',
        greeting: 'Best regards,',
        teamName: '$t(appName) team',
      },
      footer: {
        cause: '$t(email:footer.cause) you are a contact email of this camp.',
      },
    },
    waitingListConfirmation: {
      subject: 'Waiting List Notification',
      preview:
        'Waiting list notification for your registration to the camp: {{ camp.name }}',
      text: {
        title: 'Hello {{ participantName }},',
        information:
          'Thank you for your registration to {{ camp.name }}.' +
          'Unfortunately, all places have already been taken.' +
          'Your registration is now on the waiting list.' +
          'You will hear from us, when a place gets available.',
        contact:
          "If you have any further questions, please don't hesitate to contact us by replying to this email.",
        greeting: 'Best regards,',
        teamName: '$t(appName) team',
      },
      footer: {
        cause: '$t(email:footer.cause) you registered for a camp.',
      },
    },
    confirmation: {
      subject: 'Registration Confirmation',
      preview:
        'Confirmation for your registration to the camp: {{ camp.name }}',
      text: {
        title: 'Hello {{ participantName }},',
        information:
          'Thank you for your registration to {{ camp.name }}.' +
          'You will receive further information in a separate email.',
        contact:
          "If you have any further questions, please don't hesitate to contact us by replying to this email.",
        greeting: 'Best regards,',
        teamName: '$t(appName) team',
      },
      footer: {
        cause: '$t(email:footer.cause) you registered for a camp.',
      },
    },
  },
};
