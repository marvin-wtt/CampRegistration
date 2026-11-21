export default {
  email: {
    confirmation: {
      subject: 'Confirme ton abonnement à la newsletter',
      preview: 'Un clic pour recevoir « {{ newsletter }} ».',
      text: {
        title: 'Confirme ton abonnement',
        information:
          '{{ organization }} aimerait t’ajouter à la newsletter « {{ newsletter }} ». Confirme ton inscription pour recevoir les nouveautés et informations par e-mail.',
        button: 'Confirmer l’abonnement',
        accidental:
          'Tu ne t’es pas inscrit(e) ? Ignore simplement cet e-mail. Tu ne seras pas abonné(e) et ton adresse sera supprimée après 30 jours.',
      },
      footer: {
        cause:
          '$t(email:footer.cause) {{ organization }} t’a ajouté(e) à sa newsletter.',
      },
    },
    reason: '$t(email:footer.cause) tu t’es abonné(e) à cette newsletter.',
    unsubscribe: 'Se désabonner',
  },
};
