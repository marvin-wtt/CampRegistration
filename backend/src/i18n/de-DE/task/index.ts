export default {
  email: {
    dueReminder: {
      subject: 'Aufgabe fällig am {{ dueDate }}: {{ task.title }}',
      preview:
        '„{{ task.title }}“ für {{ event.name }} ist am {{ dueDate }} fällig',
      text: {
        title: 'Bald fällig: {{ task.title }}',
        information:
          'Diese Aufgabe für {{ event.name }} ist dir zugewiesen und am {{ dueDate }} fällig.',
        button: 'Aufgaben öffnen',
      },
      footer: {
        cause: '$t(email:footer.cause) dir diese Aufgabe zugewiesen ist.',
      },
    },
  },
};
