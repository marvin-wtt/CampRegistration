export default {
  email: {
    confirmation: {
      subject: 'Merci de confirmer ton abonnement à la newsletter',
      preview: '{{ organization }} aimerait t’envoyer sa newsletter.',
      text: {
        title: 'Salut,',
        information:
          '{{ organization }} aimerait t’ajouter à sa newsletter « {{ newsletter }} ». Merci de confirmer que tu souhaites la recevoir. Tu ne la recevras pas avant d’avoir confirmé.',
        button: 'Confirmer l’abonnement',
        accidental:
          'Si tu ne t’attendais pas à cet e-mail, ignore-le simplement. Tu ne seras pas inscrit(e) et ton adresse sera supprimée après 30 jours.',
        greeting: 'Cordialement,',
        teamName: 'L’équipe {{ appName }}',
      },
      footer: {
        cause:
          '$t(email:footer.cause) {{ organization }} t’a ajouté(e) à sa newsletter.',
      },
    },
    reason:
      '$t(email:footer.cause) vous vous êtes abonné(e) à notre newsletter.',
    unsubscribe: 'Se désabonner',
  },
};
