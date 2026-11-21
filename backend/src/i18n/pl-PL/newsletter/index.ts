export default {
  email: {
    confirmation: {
      subject: 'Potwierdź subskrypcję newslettera',
      preview: '{{ organization }} chce wysyłać Ci swój newsletter.',
      text: {
        title: 'Cześć,',
        information:
          '{{ organization }} chce dodać Cię do newslettera „{{ newsletter }}”. Potwierdź, że chcesz go otrzymywać. Do tego czasu nie będziesz go dostawać.',
        button: 'Potwierdź subskrypcję',
        accidental:
          'Jeśli nie spodziewałeś/-aś się tego e-maila, po prostu go zignoruj. Nie zostaniesz zapisany/-a, a Twój adres zostanie usunięty po 30 dniach.',
        greeting: 'Pozdrawiamy',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause:
          '$t(email:footer.cause) {{ organization }} dodał(a) Cię do swojego newslettera.',
      },
    },
    reason: '$t(email:footer.cause) zapisałeś/-aś się na nasz newsletter.',
    unsubscribe: 'Wypisz się',
  },
};
