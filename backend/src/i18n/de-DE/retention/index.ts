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
        preview: 'Zeit, die Daten von {{ event.name }} zu prüfen',
        text: {
          title: 'Zeit, {{ event.name }} zu prüfen',
          information:
            'Deine Datenschutzinformationen für {{ event.name }} versprechen, $t(retention:kind.{{kindKey}}) bis zum {{ date }} zu löschen. Sichere außerhalb der Plattform, was du noch brauchst, etwa Rechnungen oder Nachweise für Fördermittelgeber. Lösche die Daten danach oder verschiebe die Frist mit einer Begründung. Es wird nichts automatisch gelöscht.',
          button: 'Veranstaltung öffnen',
        },
        footer: {
          cause:
            '$t(email:footer.cause) du die Anmeldungen dieser Veranstaltung löschen kannst.',
        },
      },
      due: {
        subject: 'Speicherfrist erreicht: {{ event.name }}',
        preview:
          'Die Daten von {{ event.name }} waren am {{ date }} zu löschen',
        text: {
          title: 'Speicherfrist für {{ event.name }} erreicht',
          information:
            'Deine Datenschutzinformationen für {{ event.name }} versprechen, $t(retention:kind.{{kindKey}}) bis zum {{ date }} zu löschen. Lösche die Daten jetzt oder verschiebe die Frist mit einer Begründung, falls du sie länger aufbewahren musst. Es wird nichts automatisch gelöscht.',
          button: 'Veranstaltung öffnen',
        },
        footer: {
          cause:
            '$t(email:footer.cause) du die Anmeldungen dieser Veranstaltung löschen kannst.',
        },
      },
    },
  },
};
