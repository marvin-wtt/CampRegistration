export default {
  email: {
    confirmation: {
      subject: 'Potwierdź subskrypcję newslettera',
      preview: 'Jedno kliknięcie, aby otrzymywać „{{ newsletter }}”.',
      text: {
        title: 'Potwierdź subskrypcję',
        information:
          '{{ organization }} chce dodać Cię do newslettera „{{ newsletter }}”. Potwierdź zapis, aby otrzymywać nowości i informacje e-mailem.',
        button: 'Potwierdź subskrypcję',
        accidental:
          'To nie Ty? Po prostu zignoruj tę wiadomość. Nie zostaniesz zapisany(-a), a Twój adres zostanie usunięty po 30 dniach.',
      },
      footer: {
        cause:
          '$t(email:footer.cause) {{ organization }} dodał(a) Cię do swojego newslettera.',
      },
    },
    reason: '$t(email:footer.cause) subskrybujesz ten newsletter.',
    unsubscribe: 'Wypisz się',
  },
};
