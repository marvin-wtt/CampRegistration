export default {
  email: {
    dueReminder: {
      single: {
        title: {
          today: 'Termin dzisiaj: {{ title }}',
          tomorrow: 'Termin jutro: {{ title }}',
        },
        information:
          'To zadanie dla {{ eventName }} jest przypisane do Ciebie i ma termin {{ when }}.',
      },
      multiple: {
        title_one: '{{ count }} zadanie z bliskim terminem',
        title_few: '{{ count }} zadania z bliskim terminem',
        title_many: '{{ count }} zadań z bliskim terminem',
        title_other: '{{ count }} zadania z bliskim terminem',
        information:
          'Te zadania są przypisane do Ciebie i mają termin dzisiaj lub jutro.',
      },
      when: {
        today: 'dzisiaj ({{ date }})',
        tomorrow: 'jutro ({{ date }})',
      },
      label: {
        today: 'Termin dzisiaj · {{ date }}',
        tomorrow: 'Termin jutro · {{ date }}',
      },
      button: 'Otwórz zadania',
      footer: {
        cause: '$t(email:footer.cause) to zadanie jest przypisane do Ciebie.',
        causeMultiple:
          '$t(email:footer.cause) te zadania są przypisane do Ciebie.',
      },
    },
  },
};
