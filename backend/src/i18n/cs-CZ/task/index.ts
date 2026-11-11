export default {
  email: {
    dueReminder: {
      subject: 'Úkol s termínem {{ dueDate }}: {{ task.title }}',
      preview:
        'Úkol „{{ task.title }}“ pro {{ event.name }} má termín {{ dueDate }}',
      text: {
        title: 'Blíží se termín úkolu',
        information:
          'Úkol „{{ task.title }}“ pro akci {{ event.name }} je přiřazen vám a má termín {{ dueDate }}.',
        button: 'Otevřít úkoly',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) je vám tento úkol přiřazen.',
      },
    },
  },
};
