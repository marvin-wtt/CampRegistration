export default {
  email: {
    retentionDue: {
      subject: 'Retention period ending: {{ event.name }}',
      preview: 'The registration data of {{ event.name }} is due for review',
      text: {
        title: 'A retention period is running out',
        information:
          'The privacy information published for {{ event.name }} tells registrants their data is kept for {{ months }} months $t(event:email.retentionDue.anchor.{{anchor}}). For this event that period ends on {{ dueAt }}.',
        action:
          'Please review the event’s registrations and delete what is no longer needed. You are the one who can tell what still has to be kept.',
        exceptions:
          'Your privacy information also declares exceptions that are kept beyond this period. Do not delete what those cover.',
        consentBound:
          'Some data is kept for as long as the consent behind it stands. It stays until the person withdraws that consent, and has to be deleted promptly once they do.',
        noAutomaticDeletion:
          'Nothing has been deleted automatically. This platform never erases event data on its own — the decision and the action are yours.',
        button: 'Open the event',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
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
