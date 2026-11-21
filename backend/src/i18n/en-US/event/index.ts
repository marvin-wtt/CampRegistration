export default {
  email: {
    retentionDue: {
      subject: 'Retention period ending: {{ event.name }}',
      preview: 'Time to review the registration data of {{ event.name }}',
      text: {
        title: 'Time to review {{ event.name }}',
        information:
          'Your privacy information for {{ event.name }} says registration data is kept for {{ months }} months $t(event:email.retentionDue.anchor.{{anchor}}). That period ends on {{ dueAt }}.',
        action:
          'Review the registrations and delete what you no longer need. Only you can tell what still has to be kept.',
        exceptions:
          'Your privacy information also lists exceptions that are kept longer. Leave those in place.',
        consentBound:
          'Data based on consent may be kept as long as the consent stands. Delete it promptly once someone withdraws it.',
        noAutomaticDeletion:
          'Nothing has been deleted automatically. We never erase event data on our own — the decision is yours.',
        button: 'Open event',
      },
      // Pulled into the sentence above by nesting: the payload carries the
      // catalogue key, not a phrase.
      anchor: {
        event_end: 'after the event ends',
        submission: 'after the registration is submitted',
      },
      footer: {
        cause: '$t(email:footer.cause) you can delete this event.',
      },
    },
  },
};
