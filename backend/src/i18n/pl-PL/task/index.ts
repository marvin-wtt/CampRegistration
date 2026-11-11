export default {
  email: {
    dueReminder: {
      subject: 'Zadanie z terminem {{ dueDate }}: {{ task.title }}',
      preview:
        'Zadanie „{{ task.title }}” dla {{ event.name }} ma termin {{ dueDate }}',
      text: {
        title: 'Zbliża się termin zadania',
        information:
          'Zadanie „{{ task.title }}” dla wydarzenia {{ event.name }} jest przypisane do Ciebie i ma termin {{ dueDate }}.',
        button: 'Otwórz zadania',
        greeting: 'Pozdrawiamy,',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) to zadanie jest przypisane do Ciebie.',
      },
    },
  },
};
