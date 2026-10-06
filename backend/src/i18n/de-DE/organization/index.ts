export default {
  email: {
    reviewPending: {
      subject: 'Organisation wartet auf Prüfung: {{ organization.name }}',
      preview: '{{ organization.name }} wartet auf die Verifizierung',
      text: {
        title: 'Eine neue Organisation muss geprüft werden',
        information:
          '{{ organization.name }} wurde zur Verifizierung eingereicht. ' +
          'Bis zur Verifizierung kann sie keine Veranstaltungen veröffentlichen und keine Newsletter versenden.',
        button: 'Organisationen prüfen',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause: '$t(email:footer.cause) du Administrator bist.',
      },
    },
    verified: {
      subject: 'Deine Organisation wurde verifiziert',
      preview:
        '{{ organization.name }} kann jetzt Veranstaltungen veröffentlichen',
      text: {
        title: 'Deine Organisation wurde verifiziert',
        information:
          '{{ organization.name }} wurde verifiziert. ' +
          'Du kannst jetzt ihre Veranstaltungen veröffentlichen und Newsletter versenden.',
        button: 'Organisation öffnen',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause: '$t(email:footer.cause) du diese Organisation verwaltest.',
      },
    },
    rejected: {
      subject: 'Deine Organisation konnte nicht verifiziert werden',
      preview: '{{ organization.name }} benötigt deine Aufmerksamkeit',
      text: {
        title: 'Deine Organisation konnte nicht verifiziert werden',
        information:
          '{{ organization.name }} wurde nicht verifiziert. ' +
          'Bis dahin kann sie keine Veranstaltungen veröffentlichen und keine Newsletter versenden. ' +
          'Wenn du die registrierten Angaben korrigierst, wird sie erneut geprüft.',
        reasonLabel: 'Grund',
        button: 'Angaben prüfen',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause: '$t(email:footer.cause) du diese Organisation verwaltest.',
      },
    },
    priceModelOffered: {
      subject: 'Neue Preise für {{ organization.name }}',
      preview: 'Bitte stimme dem neuen Preismodell bis zum {{ date }} zu',
      text: {
        title: 'Bitte stimme den neuen Preisen zu',
        information:
          'Ab dem {{ date }} wechselt {{ organization.name }} zum Preismodell {{ model.name }}: {{ model.price }} pro Anmeldung zuzüglich einer Grundgebühr von {{ model.baseFee }}, inklusive {{ model.taxRate }} % Steuer. Bereits angelegte Veranstaltungen behalten ihre Preise. Solange du nicht zustimmst, kannst du ab dem {{ date }} keine neuen Veranstaltungen anlegen. Zustimmen oder ablehnen kannst du auf der Abrechnungsseite.',
        button: 'Preise ansehen',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause: '$t(email:footer.cause) du diese Organisation verwaltest.',
      },
    },
    priceModelLowered: {
      subject: 'Niedrigere Preise für {{ organization.name }}',
      preview: '{{ organization.name }} zahlt jetzt weniger',
      text: {
        title: 'Deine Preise sind gesunken',
        information:
          '{{ organization.name }} nutzt jetzt das Preismodell {{ model.name }}: {{ model.price }} pro Anmeldung zuzüglich einer Grundgebühr von {{ model.baseFee }}, inklusive {{ model.taxRate }} % Steuer. Es gilt für Veranstaltungen, die du ab jetzt anlegst. Da nichts teurer wird, musst du nicht zustimmen.',
        button: 'Abrechnung öffnen',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause: '$t(email:footer.cause) du diese Organisation verwaltest.',
      },
    },
    invoiceIssued: {
      subject: 'Rechnung für {{ event.name }}',
      preview: '{{ amount }} für {{ event.name }}',
      text: {
        title: 'Eine neue Rechnung liegt vor',
        information:
          'Die Rechnung für {{ event.name }} liegt vor: {{ amount }}. ' +
          'Du kannst sie auf der Abrechnungsseite von {{ organization.name }} herunterladen.',
        button: 'Abrechnung öffnen',
        greeting: 'Viele Grüße',
        teamName: '{{ appName }} Team',
      },
      footer: {
        cause: '$t(email:footer.cause) du diese Organisation verwaltest.',
      },
    },
  },
};
