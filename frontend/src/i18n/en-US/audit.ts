export default {
  actions: {
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
  },
  reason: 'Reason',
  viewInSettings: 'View in settings',
  entities: {
    event: {
      label: 'Event',
      fields: {
        organizationId: 'Organization',
        listed: 'Show event on main page',
        registrationOpensAt: 'Registration opens at',
        registrationClosesAt: 'Registration closes at',
        confirmationMode: 'Confirmation mode',
        countries: 'Countries',
        name: 'Name',
        organizer: 'Organizer',
        contactEmail: 'Contact email',
        maxParticipants: 'Max participants',
        minAge: 'Minimum age',
        maxAge: 'Maximum age',
        startAt: 'Start date',
        endAt: 'End date',
        price: 'Price',
        location: 'Location',
        form: 'Registration form',
        retentionReminderSentAt: 'Retention reminder sent at',
      },
    },
    registration: {
      label: 'Registration',
      fields: {
        data: 'Form answer',
        customData: 'Custom field',
        status: 'Status',
        country: 'Country',
      },
      values: {
        status: {
          ACCEPTED: 'Accepted',
          PENDING: 'Pending',
          WAITLISTED: 'Waitlisted',
        },
      },
      reasons: {
        canceled: 'Canceled',
        declined: 'Declined',
        duplicate: 'Duplicate',
        test_entry: 'Test entry',
        other: 'Other',
      },
      deleted: 'Deleted registration',
      view: 'View registration',
      gone: 'This registration no longer exists',
    },
    eventManager: {
      label: 'Access',
      actions: {
        accepted: 'Accepted',
      },
      fields: {
        role: 'Role',
        expiresAt: 'Expires at',
      },
      values: {
        role: {
          DIRECTOR: 'Director',
          COORDINATOR: 'Coordinator',
          COUNSELOR: 'Counselor',
          VIEWER: 'Viewer',
        },
      },
    },
    message: {
      label: 'Message',
      actions: {
        sent: 'Sent',
      },
      view: 'View message',
      gone: 'This message no longer exists',
    },
    messageTemplate: {
      label: 'Automated email',
      fields: {
        trigger: 'Trigger',
        country: 'Country',
        subject: 'Subject',
        body: 'Body',
        priority: 'Priority',
        replyTo: 'Reply-to',
      },
      values: {
        trigger: {
          registration_submitted: 'Registration submitted',
          registration_confirmed: 'Registration confirmed',
          registration_waitlisted: 'Registration waitlisted',
          registration_waitlist_accepted: 'Waitlist registration accepted',
          registration_updated: 'Registration updated',
          registration_canceled: 'Registration canceled',
        },
      },
    },
  },
};
