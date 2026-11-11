export default {
  email: {
    dueReminder: {
      subject: 'Aufgabe fällig am {{ dueDate }}: {{ task.title }}',
      preview:
        '„{{ task.title }}“ für {{ event.name }} ist am {{ dueDate }} fällig',
      text: {
        title: 'Eine Aufgabe ist bald fällig',
        information:
          'Die Aufgabe „{{ task.title }}“ für {{ event.name }} ist dir zugewiesen und am {{ dueDate }} fällig.',
        button: 'Aufgaben öffnen',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause: '$t(email:footer.cause) dir diese Aufgabe zugewiesen ist.',
      },
    },
  },
};
