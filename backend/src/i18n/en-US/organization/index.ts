export default {
  email: {
    reviewPending: {
      subject: 'Organization awaiting review: {{ organization.name }}',
      preview: '{{ organization.name }} is waiting to be verified',
      text: {
        title: 'A new organization needs review',
        information:
          '{{ organization.name }} has been submitted for verification. ' +
          'Until it is verified it cannot publish events or send newsletters.',
        button: 'Review organizations',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) you are an administrator.',
      },
    },
    verified: {
      subject: 'Your organization has been verified',
      preview: '{{ organization.name }} can now publish events',
      text: {
        title: 'Your organization has been verified',
        information:
          '{{ organization.name }} has been verified. ' +
          'You can now publish its events and send newsletters.',
        button: 'Open organization',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) you administer this organization.',
      },
    },
    rejected: {
      subject: 'Your organization could not be verified',
      preview: '{{ organization.name }} needs your attention',
      text: {
        title: 'Your organization could not be verified',
        information:
          '{{ organization.name }} has not been verified. ' +
          'It cannot publish events or send newsletters until it is. ' +
          'Correcting its registered details puts it back into review.',
        reasonLabel: 'Reason',
        button: 'Review the details',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) you administer this organization.',
      },
    },
  },
};
