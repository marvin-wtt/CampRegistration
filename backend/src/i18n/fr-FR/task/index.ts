export default {
  email: {
    dueReminder: {
      subject: 'Tâche à rendre le {{ dueDate }} : {{ task.title }}',
      preview:
        '« {{ task.title }} » pour {{ event.name }} est à rendre le {{ dueDate }}',
      text: {
        title: 'Bientôt à échéance : {{ task.title }}',
        information:
          'Cette tâche pour {{ event.name }} t’est assignée et arrive à échéance le {{ dueDate }}.',
        button: 'Ouvrir les tâches',
      },
      footer: {
        cause: '$t(email:footer.cause) cette tâche t’est assignée.',
      },
    },
  },
};
