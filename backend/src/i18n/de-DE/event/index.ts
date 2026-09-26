export default {
  email: {
    retentionDue: {
      subject: 'Speicherfrist läuft ab: {{ event.name }}',
      preview: 'Die Anmeldedaten von {{ event.name }} sollten geprüft werden',
      text: {
        title: 'Eine Speicherfrist läuft ab',
        information:
          'In den Datenschutzinformationen zu {{ event.name }} steht, dass die Daten {{ months }} Monate $t(event:email.retentionDue.anchor.{{anchor}}) gespeichert werden. Für diese Veranstaltung endet diese Frist am {{ dueAt }}.',
        action:
          'Bitte sieh die Anmeldungen der Veranstaltung durch und lösche, was nicht mehr benötigt wird. Nur ihr könnt beurteilen, was weiterhin aufbewahrt werden muss.',
        exceptions:
          'Eure Datenschutzinformationen nennen außerdem Ausnahmen, die länger gespeichert werden. Lösche nicht, was davon erfasst ist.',
        consentBound:
          'Manche Daten werden so lange gespeichert, wie die zugrunde liegende Einwilligung besteht. Sie bleiben, bis die Person die Einwilligung widerruft, und müssen dann unverzüglich gelöscht werden.',
        noAutomaticDeletion:
          'Es wurde nichts automatisch gelöscht. Diese Plattform löscht Veranstaltungsdaten niemals von selbst — Entscheidung und Ausführung liegen bei euch.',
        button: 'Veranstaltung öffnen',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
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
