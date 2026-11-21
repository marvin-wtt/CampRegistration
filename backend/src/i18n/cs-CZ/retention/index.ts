export default {
  kind: {
    sensitive: 'zdravotní a další citlivé údaje',
    registrations: 'všechny údaje z přihlášek',
  },
  email: {
    manager: {
      upcoming: {
        subject_one: 'Lhůta uchování za {{ count }} den: {{ event.name }}',
        subject_few: 'Lhůta uchování za {{ count }} dny: {{ event.name }}',
        subject_many: 'Lhůta uchování za {{ count }} dne: {{ event.name }}',
        subject_other: 'Lhůta uchování za {{ count }} dní: {{ event.name }}',
        preview: 'Je čas zkontrolovat údaje akce {{ event.name }}',
        text: {
          title: 'Je čas zkontrolovat akci {{ event.name }}',
          information:
            'Tvoje informace o ochraně osobních údajů akce {{ event.name }} slibují smazat $t(retention:kind.{{kindKey}}) nejpozději {{ date }}. Ulož si mimo platformu kopii toho, co ještě potřebuješ, například faktury nebo doklady pro poskytovatele dotace. Poté údaje smaž, nebo lhůtu s uvedením důvodu odlož. Nic se nemaže automaticky.',
          button: 'Otevřít akci',
        },
        footer: {
          cause: '$t(email:footer.cause) můžeš mazat přihlášky této akce.',
        },
      },
      due: {
        subject: 'Lhůta uchování uplynula: {{ event.name }}',
        preview: 'Údaje akce {{ event.name }} bylo třeba smazat do {{ date }}',
        text: {
          title: 'Lhůta uchování akce {{ event.name }} uplynula',
          information:
            'Tvoje informace o ochraně osobních údajů akce {{ event.name }} slibují smazat $t(retention:kind.{{kindKey}}) nejpozději {{ date }}. Smaž údaje nyní, nebo lhůtu s uvedením důvodu odlož, pokud je musíš uchovat déle. Nic se nemaže automaticky.',
          button: 'Otevřít akci',
        },
        footer: {
          cause: '$t(email:footer.cause) můžeš mazat přihlášky této akce.',
        },
      },
    },
  },
};
