export default {
  email: {
    reason: '$t(email:footer.cause) you registered for this event.',
    privacyLink: 'Privacy information for this event',
    changes: {
      cleared: 'removed',
      file: 'file updated',
      sensitive: 'changed',
    },
    managerNotification: {
      subject: 'New registration | {{ event.name }}',
      preview: 'New registration for {{ event.name }}',
      text: {
        title: 'New registration',
        information:
          '{{ registration.firstName }} {{ registration.lastName }} just registered for {{ event.name }}.',
        button: 'View registrations',
      },
      footer: {
        cause: '$t(email:footer.cause) you are a contact email of this event.',
      },
    },
    messageBounced: {
      subject: 'Message undelivered | {{ event.name }}',
      preview:
        'A message to {{ recipient }} could not be delivered for {{ event.name }}',
      text: {
        title: 'Your message wasn’t delivered',
        information:
          '“{{ messageSubject }}” to {{ recipient }} for {{ event.name }} couldn’t be delivered. It’s worth checking the email address of this registration.',
        button: 'View registrations',
      },
      footer: {
        cause: '$t(email:footer.cause) you are a contact email of this event.',
      },
    },
  },
};
