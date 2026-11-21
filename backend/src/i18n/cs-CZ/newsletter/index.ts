export default {
  email: {
    confirmation: {
      subject: 'Potvrď odběr newsletteru',
      preview: 'Jedno kliknutí a budeš dostávat „{{ newsletter }}“.',
      text: {
        title: 'Potvrď odběr',
        information:
          '{{ organization }} tě chce přidat do newsletteru „{{ newsletter }}“. Potvrď přihlášení a dostávej novinky a informace e-mailem.',
        button: 'Potvrdit odběr',
        accidental:
          'Nepřihlásil(a) ses? Jednoduše tento e-mail ignoruj. Nebudeš přihlášen(a) a tvoje adresa bude po 30 dnech smazána.',
      },
      footer: {
        cause:
          '$t(email:footer.cause) tě {{ organization }} přidal/a do svého newsletteru.',
      },
    },
    reason: '$t(email:footer.cause) odebíráš tento newsletter.',
    unsubscribe: 'Odhlásit se',
  },
};
