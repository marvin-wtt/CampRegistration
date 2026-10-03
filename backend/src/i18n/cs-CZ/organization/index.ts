export default {
  email: {
    reviewPending: {
      subject: 'Organizace čeká na kontrolu: {{ organization.name }}',
      preview: '{{ organization.name }} čeká na ověření',
      text: {
        title: 'Nová organizace vyžaduje kontrolu',
        information:
          '{{ organization.name }} byla odeslána k ověření. ' +
          'Než bude ověřena, nemůže zveřejňovat akce ani posílat newslettery.',
        button: 'Zkontrolovat organizace',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) jsi správce.',
      },
    },
    verified: {
      subject: 'Tvoje organizace byla ověřena',
      preview: '{{ organization.name }} může nyní zveřejňovat akce',
      text: {
        title: 'Tvoje organizace byla ověřena',
        information:
          '{{ organization.name }} byla ověřena. ' +
          'Nyní můžeš zveřejňovat její akce a posílat newslettery.',
        button: 'Otevřít organizaci',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) spravuješ tuto organizaci.',
      },
    },
    rejected: {
      subject: 'Tvoji organizaci se nepodařilo ověřit',
      preview: '{{ organization.name }} vyžaduje tvoji pozornost',
      text: {
        title: 'Tvoji organizaci se nepodařilo ověřit',
        information:
          '{{ organization.name }} nebyla ověřena. ' +
          'Do té doby nemůže zveřejňovat akce ani posílat newslettery. ' +
          'Oprava registrovaných údajů ji vrátí zpět k ověření.',
        reasonLabel: 'Důvod',
        button: 'Zkontrolovat údaje',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) spravuješ tuto organizaci.',
      },
    },
    priceModelOffered: {
      subject: 'Nové ceny pro {{ organization.name }}',
      preview: 'Přijmi prosím nový cenový model do {{ date }}',
      text: {
        title: 'Přijmi prosím nové ceny',
        information:
          'Od {{ date }} přechází {{ organization.name }} na cenový model {{ model.name }}: {{ model.price }} za přihlášku plus základní poplatek {{ model.baseFee }}, včetně {{ model.taxRate }} % daně. Již vytvořené akce si ponechají své ceny. Dokud nový model nepřijmeš, nemůžeš od {{ date }} vytvářet nové akce. Přijmout nebo odmítnout ho můžeš na stránce vyúčtování.',
        button: 'Zobrazit ceny',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) spravuješ tuto organizaci.',
      },
    },
    priceModelLowered: {
      subject: 'Nižší ceny pro {{ organization.name }}',
      preview: '{{ organization.name }} nyní platí méně',
      text: {
        title: 'Tvé ceny klesly',
        information:
          '{{ organization.name }} nyní používá cenový model {{ model.name }}: {{ model.price }} za přihlášku plus základní poplatek {{ model.baseFee }}, včetně {{ model.taxRate }} % daně. Platí pro akce vytvořené od teď. Nic nezdražilo, takže není co přijímat.',
        button: 'Otevřít vyúčtování',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) spravuješ tuto organizaci.',
      },
    },
    invoiceIssued: {
      subject: 'Faktura za {{ event.name }}',
      preview: '{{ amount }} za {{ event.name }}',
      text: {
        title: 'Nová faktura je připravena',
        information:
          'Faktura za {{ event.name }} je připravena: {{ amount }}. ' +
          'Můžeš si ji stáhnout na stránce vyúčtování organizace {{ organization.name }}.',
        button: 'Otevřít vyúčtování',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) spravuješ tuto organizaci.',
      },
    },
  },
};
