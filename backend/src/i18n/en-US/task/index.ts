export default {
  email: {
    dueReminder: {
      subject: 'Task due on {{ dueDate }}: {{ task.title }}',
      preview:
        '“{{ task.title }}” for {{ event.name }} is due on {{ dueDate }}',
      text: {
        title: 'Due soon: {{ task.title }}',
        information:
          'This task for {{ event.name }} is assigned to you and due on {{ dueDate }}.',
        button: 'Open tasks',
      },
      footer: {
        cause: '$t(email:footer.cause) this task is assigned to you.',
      },
    },
  },
};
