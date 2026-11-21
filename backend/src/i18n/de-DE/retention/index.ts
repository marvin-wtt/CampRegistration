export default {
  kind: {
    sensitive: 'Gesundheitsangaben und andere sensible Daten',
    registrations: 'alle Anmeldedaten',
  },
  email: {
    manager: {
      upcoming: {
        subject_one: 'Speicherfrist in {{ count }} Tag: {{ event.name }}',
        subject_other: 'Speicherfrist in {{ count }} Tagen: {{ event.name }}',
        preview: 'Daten von {{ event.name }} sind am {{ date }} zu löschen',
        text: {
          title: 'Eine Speicherfrist läuft bald ab',
          information:
            'Laut den Datenschutzinformationen von {{ event.name }} werden $t(retention:kind.{{kindKey}}) bis zum {{ date }} gelöscht. Prüfe jetzt, ob etwas länger aufbewahrt werden muss, etwa Rechnungen oder Nachweise für Fördermittelgeber, und sichere es außerhalb der Plattform. Lösche die Daten danach oder verschiebe die Frist mit einer Begründung. Es wird nichts automatisch gelöscht.',
          button: 'Veranstaltung öffnen',
          greeting: 'Viele Grüße',
          teamName: '{{ appName }} Team',
        },
        footer: {
          cause:
            '$t(email:footer.cause) du die Anmeldungen dieser Veranstaltung löschen kannst.',
        },
      },
      due: {
        subject: 'Speicherfrist erreicht: {{ event.name }}',
        preview: 'Daten von {{ event.name }} waren am {{ date }} zu löschen',
        text: {
          title: 'Eine Speicherfrist ist erreicht',
          information:
            'Die Speicherfrist für $t(retention:kind.{{kindKey}}) von {{ event.name }} ist der {{ date }}. Lösche die Daten jetzt oder verschiebe die Frist mit einer Begründung, falls sie länger aufbewahrt werden müssen. Es wird nichts automatisch gelöscht.',
          button: 'Veranstaltung öffnen',
          greeting: 'Viele Grüße',
          teamName: '{{ appName }} Team',
        },
        footer: {
          cause:
            '$t(email:footer.cause) du die Anmeldungen dieser Veranstaltung löschen kannst.',
        },
      },
    },
  },
};
