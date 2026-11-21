export default {
  kind: {
    sensitive: 'zdravotní a další citlivé údaje',
    registrations: 'všechny údaje z přihlášek',
  },
  email: {
    manager: {
      upcoming: {
        subject: 'Lhůta uchování za {{ days }} dní: {{ event.name }}',
        preview: 'Údaje akce {{ event.name }} je třeba smazat do {{ date }}',
        text: {
          title: 'Blíží se lhůta uchování',
          information:
            'Podle informací o ochraně osobních údajů akce {{ event.name }} se $t(retention:kind.{{kindKey}}) mažou nejpozději {{ date }}. Zkontrolujte nyní, zda je třeba něco uchovat déle, například faktury nebo doklady pro poskytovatele dotace, a uložte si kopii mimo platformu. Poté údaje smažte, nebo lhůtu s uvedením důvodu odložte. Nic se nemaže automaticky.',
          button: 'Otevřít akci',
          greeting: 'S pozdravem',
          teamName: 'Tým {{ appName }}',
        },
        footer: {
          cause: '$t(email:footer.cause) můžete mazat přihlášky této akce.',
        },
      },
      due: {
        subject: 'Lhůta uchování uplynula: {{ event.name }}',
        preview: 'Údaje akce {{ event.name }} bylo třeba smazat do {{ date }}',
        text: {
          title: 'Lhůta uchování uplynula',
          information:
            'Lhůta uchování pro $t(retention:kind.{{kindKey}}) akce {{ event.name }} je {{ date }}. Smažte údaje nyní, nebo lhůtu s uvedením důvodu odložte, pokud je třeba je uchovat déle. Nic se nemaže automaticky.',
          button: 'Otevřít akci',
          greeting: 'S pozdravem',
          teamName: 'Tým {{ appName }}',
        },
        footer: {
          cause: '$t(email:footer.cause) můžete mazat přihlášky této akce.',
        },
      },
    },
  },
};
