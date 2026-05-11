export default {
  email: {
    reason: '$t(email:footer.cause) you registered for this camp.',
    managerNotification: {
      subject: 'New Registration | {{ camp.name }}',
      preview: 'New registration for the camp: {{ camp.name }}',
      text: {
        title: 'Hello,',
        information:
          '{{ registration.firstName }} {{ registration.lastName }} registered for {{ camp.name }}.',
        button: 'View Registrations',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) you are a contact email of this camp.',
      },
    },
  },
};
