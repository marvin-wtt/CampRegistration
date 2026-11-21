export default {
  email: {
    retentionDue: {
      subject: 'Fin de la durée de conservation : {{ event.name }}',
      preview:
        'Il est temps de vérifier les données d’inscription de {{ event.name }}',
      text: {
        title: 'Il est temps de vérifier {{ event.name }}',
        information:
          'D’après tes informations sur la protection des données pour {{ event.name }}, les données d’inscription sont conservées {{ months }} mois $t(event:email.retentionDue.anchor.{{anchor}}). Cette durée prend fin le {{ dueAt }}.',
        action:
          'Passe en revue les inscriptions et supprime ce dont tu n’as plus besoin. Toi seul(e) peux juger de ce qui doit encore être conservé.',
        exceptions:
          'Tes informations sur la protection des données prévoient aussi des exceptions conservées plus longtemps. Laisse-les en place.',
        consentBound:
          'Les données fondées sur un consentement peuvent être conservées tant que celui-ci est valable. Supprime-les rapidement dès qu’une personne le retire.',
        noAutomaticDeletion:
          'Rien n’a été supprimé automatiquement. Nous n’effaçons jamais les données d’un événement de nous-mêmes — la décision t’appartient.',
        button: 'Ouvrir l’événement',
      },
      // Pulled into the sentence above by nesting: the payload carries the
      // catalogue key, not a phrase.
      anchor: {
        event_end: 'après la fin de l’événement',
        submission: 'après l’envoi de l’inscription',
      },
      footer: {
        cause: '$t(email:footer.cause) tu peux supprimer cet événement.',
      },
    },
  },
};
