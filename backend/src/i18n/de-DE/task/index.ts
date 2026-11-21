export default {
  email: {
    dueReminder: {
      single: {
        title: {
          today: 'Heute fällig: {{ title }}',
          tomorrow: 'Morgen fällig: {{ title }}',
        },
        information:
          'Diese Aufgabe für {{ eventName }} ist dir zugewiesen und {{ when }} fällig.',
      },
      multiple: {
        title_one: '{{ count }} Aufgabe bald fällig',
        title_other: '{{ count }} Aufgaben bald fällig',
        information:
          'Diese Aufgaben sind dir zugewiesen und heute oder morgen fällig.',
      },
      when: {
        today: 'heute ({{ date }})',
        tomorrow: 'morgen ({{ date }})',
      },
      label: {
        today: 'Heute fällig · {{ date }}',
        tomorrow: 'Morgen fällig · {{ date }}',
      },
      button: 'Aufgaben öffnen',
      footer: {
        cause: '$t(email:footer.cause) dir diese Aufgabe zugewiesen ist.',
        causeMultiple:
          '$t(email:footer.cause) dir diese Aufgaben zugewiesen sind.',
      },
    },
  },
};
