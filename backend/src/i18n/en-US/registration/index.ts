export default {
  email: {
    managerNotification: {
      subject: 'Registration Notification',
      preview: 'New registration for the camp: {{ camp.name }}',
      text: {
        title: 'Hello,',
        information:
          '{{ registration.fullName }} registered for {{ camp.name }}.',
        button: 'View Registrations',
        greeting: 'Best regards,',
        teamName: '$t(appName) team',
      },
      footer: {
        cause: '$t(email:footer.cause) you are a contact email of this camp.',
      },
    },
  },
};
