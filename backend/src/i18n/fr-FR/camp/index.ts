export default {
  email: {
    retentionDue: {
      subject: 'Fin de la durée de conservation : {{ camp.name }}',
      preview: 'Les données d’inscription de {{ camp.name }} sont à revoir',
      text: {
        title: 'Une durée de conservation arrive à son terme',
        information:
          'Les informations sur la protection des données publiées pour {{ camp.name }} indiquent aux personnes inscrites que leurs données sont conservées {{ months }} mois $t(camp:email.retentionDue.anchor.{{anchor}}). Pour ce séjour, cette durée prend fin le {{ dueAt }}.',
        action:
          'Merci d’examiner les inscriptions du séjour et de supprimer ce qui n’est plus nécessaire. Vous seuls pouvez juger de ce qui doit encore être conservé.',
        exceptions:
          'Vos informations sur la protection des données prévoient aussi des exceptions conservées au-delà de cette durée. Ne supprimez pas ce qu’elles couvrent.',
        consentBound:
          'Certaines données sont conservées tant que le consentement sur lequel elles reposent demeure. Elles restent jusqu’au retrait du consentement, et doivent alors être supprimées sans délai.',
        noAutomaticDeletion:
          'Rien n’a été supprimé automatiquement. Cette plateforme n’efface jamais d’elle-même les données d’un séjour — la décision et l’action vous appartiennent.',
        button: 'Ouvrir le séjour',
        greeting: 'Cordialement,',
        teamName: "L'équipe {{ appName }}",
      },
      // Pulled into the sentence above by nesting: the payload carries the
      // catalogue key, not a phrase.
      anchor: {
        camp_end: 'après la fin du séjour',
        submission: 'après l’envoi de l’inscription',
      },
      footer: {
        cause: '$t(email:footer.cause) vous pouvez supprimer ce séjour.',
      },
    },
  },
};
