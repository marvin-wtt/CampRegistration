export default {
  email: {
    dueReminder: {
      single: {
        title: {
          today: 'Due today: {{ title }}',
          tomorrow: 'Due tomorrow: {{ title }}',
        },
        information:
          'This task for {{ eventName }} is assigned to you and due {{ when }}.',
      },
      multiple: {
        title_one: '{{ count }} task due soon',
        title_other: '{{ count }} tasks due soon',
        information:
          'These tasks are assigned to you and due today or tomorrow.',
      },
      when: {
        today: 'today ({{ date }})',
        tomorrow: 'tomorrow ({{ date }})',
      },
      label: {
        today: 'Due today · {{ date }}',
        tomorrow: 'Due tomorrow · {{ date }}',
      },
      button: 'Open tasks',
      footer: {
        cause: '$t(email:footer.cause) this task is assigned to you.',
        causeMultiple:
          '$t(email:footer.cause) these tasks are assigned to you.',
      },
    },
  },
};
