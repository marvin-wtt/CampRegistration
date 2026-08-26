export default {
  email: {
    reason: '$t(email:footer.cause) you registered for this event.',
    privacyLink: 'Privacy information for this event',
    changes: {
      cleared: 'removed',
      file: 'file updated',
    },
    managerNotification: {
      subject: 'New Registration | {{ event.name }}',
      preview: 'New registration for the event: {{ event.name }}',
      text: {
        title: 'Hello,',
        information:
          '{{ registration.firstName }} {{ registration.lastName }} registered for {{ event.name }}.',
        button: 'View Registrations',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) you are a contact email of this event.',
      },
    },
  },
};
