export default {
  kind: {
    sensitive: 'health and other sensitive details',
    registrations: 'all registration data',
  },
  email: {
    manager: {
      upcoming: {
        subject_one: 'Retention deadline in {{ count }} day: {{ event.name }}',
        subject_other:
          'Retention deadline in {{ count }} days: {{ event.name }}',
        preview: 'Time to review the data of {{ event.name }}',
        text: {
          title: 'Time to review {{ event.name }}',
          information:
            'Your privacy information for {{ event.name }} promises to delete $t(retention:kind.{{kindKey}}) by {{ date }}. Keep a copy outside the platform of anything you still need, such as invoices or records for a funding body. Then delete the data, or postpone the deadline with a reason. Nothing is deleted automatically.',
          button: 'Open event',
        },
        footer: {
          cause:
            '$t(email:footer.cause) you can delete this event’s registrations.',
        },
      },
      due: {
        subject: 'Retention deadline reached: {{ event.name }}',
        preview:
          'The data of {{ event.name }} was due for deletion on {{ date }}',
        text: {
          title: 'Retention deadline reached for {{ event.name }}',
          information:
            'Your privacy information for {{ event.name }} promised to delete $t(retention:kind.{{kindKey}}) by {{ date }}. Delete the data now, or postpone the deadline with a reason if you have to keep it longer. Nothing is deleted automatically.',
          button: 'Open event',
        },
        footer: {
          cause:
            '$t(email:footer.cause) you can delete this event’s registrations.',
        },
      },
    },
  },
};
