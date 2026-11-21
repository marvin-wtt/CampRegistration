export default {
  email: {
    dueReminder: {
      subject: 'Úkol s termínem {{ dueDate }}: {{ task.title }}',
      preview:
        '„{{ task.title }}“ k akci {{ event.name }} má termín {{ dueDate }}',
      text: {
        title: 'Brzy termín: {{ task.title }}',
        information:
          'Tento úkol k akci {{ event.name }} je přiřazený tobě a má termín {{ dueDate }}.',
        button: 'Otevřít úkoly',
      },
      footer: {
        cause: '$t(email:footer.cause) je ti tento úkol přiřazený.',
      },
    },
  },
};
