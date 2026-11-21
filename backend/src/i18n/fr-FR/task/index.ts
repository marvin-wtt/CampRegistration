export default {
  email: {
    dueReminder: {
      single: {
        title: {
          today: 'À faire aujourd’hui : {{ title }}',
          tomorrow: 'À faire demain : {{ title }}',
        },
        information:
          'Cette tâche pour {{ eventName }} t’est assignée et arrive à échéance {{ when }}.',
      },
      multiple: {
        title_one: '{{ count }} tâche bientôt à échéance',
        title_other: '{{ count }} tâches bientôt à échéance',
        information:
          'Ces tâches te sont assignées et arrivent à échéance aujourd’hui ou demain.',
      },
      when: {
        today: 'aujourd’hui ({{ date }})',
        tomorrow: 'demain ({{ date }})',
      },
      label: {
        today: 'Échéance aujourd’hui · {{ date }}',
        tomorrow: 'Échéance demain · {{ date }}',
      },
      button: 'Ouvrir les tâches',
      footer: {
        cause: '$t(email:footer.cause) cette tâche t’est assignée.',
        causeMultiple: '$t(email:footer.cause) ces tâches te sont assignées.',
      },
    },
  },
};
