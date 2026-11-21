export default {
  email: {
    retentionDue: {
      subject: 'Speicherfrist läuft ab: {{ event.name }}',
      preview: 'Zeit, die Anmeldedaten von {{ event.name }} zu prüfen',
      text: {
        title: 'Zeit, {{ event.name }} zu prüfen',
        information:
          'Laut deinen Datenschutzinformationen zu {{ event.name }} werden Anmeldedaten {{ months }} Monate $t(event:email.retentionDue.anchor.{{anchor}}) gespeichert. Diese Frist endet am {{ dueAt }}.',
        action:
          'Sieh dir die Anmeldungen an und lösche, was du nicht mehr brauchst. Nur du kannst beurteilen, was weiterhin aufbewahrt werden muss.',
        exceptions:
          'Deine Datenschutzinformationen nennen außerdem Ausnahmen, die länger gespeichert werden. Lass diese bestehen.',
        consentBound:
          'Daten, die auf einer Einwilligung beruhen, dürfen so lange bleiben, wie die Einwilligung besteht. Lösche sie zeitnah, sobald jemand sie widerruft.',
        noAutomaticDeletion:
          'Es wurde nichts automatisch gelöscht. Wir löschen Veranstaltungsdaten nie von selbst — die Entscheidung liegt bei dir.',
        button: 'Veranstaltung öffnen',
      },
      // Pulled into the sentence above by nesting: the payload carries the
      // catalogue key, not a phrase.
      anchor: {
        event_end: 'nach Ende der Veranstaltung',
        submission: 'nach Absenden der Anmeldung',
      },
      footer: {
        cause: '$t(email:footer.cause) du diese Veranstaltung löschen kannst.',
      },
    },
  },
};
