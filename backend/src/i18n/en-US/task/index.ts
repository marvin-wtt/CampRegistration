export default {
  email: {
    dueReminder: {
      subject: 'Task due on {{ dueDate }}: {{ task.title }}',
      preview:
        '“{{ task.title }}” for {{ event.name }} is due on {{ dueDate }}',
      text: {
        title: 'A task is due soon',
        information:
          'The task “{{ task.title }}” for {{ event.name }} is assigned to you and due on {{ dueDate }}.',
        button: 'Open tasks',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) this task is assigned to you.',
      },
    },
  },
};
