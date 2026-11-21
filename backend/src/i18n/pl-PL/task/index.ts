export default {
  email: {
    dueReminder: {
      subject: 'Termin zadania {{ dueDate }}: {{ task.title }}',
      preview:
        '„{{ task.title }}” dla {{ event.name }} ma termin {{ dueDate }}',
      text: {
        title: 'Wkrótce termin: {{ task.title }}',
        information:
          'To zadanie dla {{ event.name }} jest przypisane do Ciebie i ma termin {{ dueDate }}.',
        button: 'Otwórz zadania',
      },
      footer: {
        cause: '$t(email:footer.cause) to zadanie jest przypisane do Ciebie.',
      },
    },
  },
};
