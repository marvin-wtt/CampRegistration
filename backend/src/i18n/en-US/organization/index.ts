export default {
  email: {
    reviewPending: {
      subject: 'Organization awaiting review: {{ organization.name }}',
      preview: '{{ organization.name }} is waiting to be verified',
      text: {
        title: 'New organization to review',
        information:
          '{{ organization.name }} is waiting for verification. ' +
          'Until then, it can’t publish events or send newsletters.',
        button: 'Review organization',
      },
      footer: {
        cause: '$t(email:footer.cause) you are an administrator.',
      },
    },
    verified: {
      subject: 'Your organization is verified',
      preview: '{{ organization.name }} can now publish events',
      text: {
        title: '{{ organization.name }} is verified',
        information:
          'Good news: you can now publish events and send newsletters.',
        button: 'Open organization',
      },
      footer: {
        cause: '$t(email:footer.cause) you administer this organization.',
      },
    },
    rejected: {
      subject: 'Your organization could not be verified',
      preview: '{{ organization.name }} needs your attention',
      text: {
        title: 'We couldn’t verify {{ organization.name }}',
        information:
          'Until it’s verified, it can’t publish events or send newsletters. ' +
          'Update its details and we’ll review it again.',
        reasonLabel: 'Reason',
        button: 'Update details',
      },
      footer: {
        cause: '$t(email:footer.cause) you administer this organization.',
      },
    },
  },
};
