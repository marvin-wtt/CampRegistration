export default {
  kind: {
    sensitive: 'health and other sensitive details',
    registrations: 'all registration data',
  },
  email: {
    manager: {
      upcoming: {
        subject: 'Retention deadline in {{ days }} days: {{ event.name }}',
        preview: 'Data of {{ event.name }} is due for deletion on {{ date }}',
        text: {
          title: 'A retention deadline is coming up',
          information:
            'The privacy notice of {{ event.name }} says that $t(retention:kind.{{kindKey}}) are deleted by {{ date }}. Check now whether anything must be kept for longer, such as invoices or records for a funding body, and keep a copy of it outside the platform. Then delete the data, or postpone the deadline with a reason. Nothing is deleted automatically.',
          button: 'Open event',
          greeting: 'Best regards',
          teamName: '{{ appName }} Team',
        },
        footer: {
          cause:
            '$t(email:footer.cause) you can delete the registrations of this event.',
        },
      },
      due: {
        subject: 'Retention deadline reached: {{ event.name }}',
        preview: 'Data of {{ event.name }} was due for deletion on {{ date }}',
        text: {
          title: 'A retention deadline has been reached',
          information:
            'The retention deadline for $t(retention:kind.{{kindKey}}) of {{ event.name }} is {{ date }}. Delete the data now, or postpone the deadline with a reason if it must be kept for longer. Nothing is deleted automatically.',
          button: 'Open event',
          greeting: 'Best regards',
          teamName: '{{ appName }} Team',
        },
        footer: {
          cause:
            '$t(email:footer.cause) you can delete the registrations of this event.',
        },
      },
    },
  },
};
