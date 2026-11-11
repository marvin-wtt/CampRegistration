export default {
  email: {
    dueReminder: {
      subject: 'Tâche à rendre le {{ dueDate }} : {{ task.title }}',
      preview:
        '« {{ task.title }} » pour {{ event.name }} est à rendre le {{ dueDate }}',
      text: {
        title: 'Une tâche arrive à échéance',
        information:
          'La tâche « {{ task.title }} » pour {{ event.name }} t’est assignée et arrive à échéance le {{ dueDate }}.',
        button: 'Ouvrir les tâches',
        greeting: 'Bien à toi,',
        teamName: 'Équipe {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) cette tâche t’est assignée.',
      },
    },
  },
};
