export default {
  actions: {
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
  },
  reason: 'Reason',
  deletedUser: 'Deleted user',
  today: 'Today',
  yesterday: 'Yesterday',
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
        timezone: 'Time zone',
        form: 'Registration form',
        payoutNumberPrefix: 'Payout number prefix',
      },
    },
    registration: {
      label: 'Registration',
      fields: {
        data: 'Form answer',
        customData: 'Custom field',
        customFiles: 'Custom file',
        status: 'Status',
        country: 'Country',
        group: 'Group',
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
      reasons: {
        account_deleted: 'Account deleted',
      },
      fields: {
        role: 'Role',
        expiresAt: 'Expires at',
      },
      values: {
        role: {
          DIRECTOR: 'Director',
          COORDINATOR: 'Coordinator',
          TREASURER: 'Treasurer',
          COUNSELOR: 'Counselor',
          VIEWER: 'Viewer',
        },
      },
    },
    message: {
      label: 'Message',
      fields: {
        recipients: 'Recipients',
      },
      actions: {
        sent: 'Sent',
      },
      view: 'View message',
      gone: 'This message no longer exists',
    },
    expense: {
      label: 'Expense',
      fields: {
        type: 'Type',
        amount: 'Amount',
        originalAmount: 'Original amount',
        originalCurrency: 'Original currency',
        date: 'Date',
        description: 'Description',
        categoryId: 'Category',
        paidByUserId: 'Paid by',
        paidByName: 'Paid by (name)',
        files: 'Receipt files',
        receiptNumber: 'Receipt number',
      },
      values: {
        type: {
          EXPENSE: 'Expense',
          REFUND: 'Refund',
        },
      },
    },
    expenseCategory: {
      label: 'Expense category',
      fields: {
        name: 'Name',
        parentId: 'Group',
        position: 'Position',
        archivedAt: 'Archived',
      },
    },
    payout: {
      label: 'Payout',
      actions: {
        signed: 'Signed',
        unsigned: 'Signature removed',
      },
      fields: {
        recipientUserId: 'Recipient',
        recipientName: 'Recipient (name)',
        direction: 'Direction',
        amount: 'Amount',
        note: 'Note',
        number: 'Number',
        paidOn: 'Paid on',
        signedAt: 'Signed',
      },
      values: {
        direction: {
          OUT: 'Paid out',
          IN: 'Paid back',
        },
      },
    },
    messageTemplate: {
      label: 'Automated email',
      fields: {
        trigger: 'Trigger',
        group: 'Group',
        subject: 'Subject',
        body: 'Body',
        priority: 'Priority',
        replyTo: 'Reply-to',
        attachments: 'Attachments',
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
