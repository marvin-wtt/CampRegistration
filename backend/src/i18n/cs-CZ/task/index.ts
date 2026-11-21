export default {
  email: {
    dueReminder: {
      single: {
        title: {
          today: 'Termín dnes: {{ title }}',
          tomorrow: 'Termín zítra: {{ title }}',
        },
        information:
          'Tento úkol k akci {{ eventName }} je přiřazený tobě a má termín {{ when }}.',
      },
      multiple: {
        title_one: '{{ count }} úkol s blížícím se termínem',
        title_few: '{{ count }} úkoly s blížícím se termínem',
        title_many: '{{ count }} úkolu s blížícím se termínem',
        title_other: '{{ count }} úkolů s blížícím se termínem',
        information:
          'Tyto úkoly jsou přiřazené tobě a mají termín dnes nebo zítra.',
      },
      when: {
        today: 'dnes ({{ date }})',
        tomorrow: 'zítra ({{ date }})',
      },
      label: {
        today: 'Termín dnes · {{ date }}',
        tomorrow: 'Termín zítra · {{ date }}',
      },
      button: 'Otevřít úkoly',
      footer: {
        cause: '$t(email:footer.cause) je ti tento úkol přiřazený.',
        causeMultiple: '$t(email:footer.cause) jsou ti tyto úkoly přiřazené.',
      },
    },
  },
};
