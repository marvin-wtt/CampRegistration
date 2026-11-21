export default {
  email: {
    retentionDue: {
      subject: 'Končí doba uchování: {{ event.name }}',
      preview: 'Je čas zkontrolovat údaje z přihlášek k akci {{ event.name }}',
      text: {
        title: 'Je čas zkontrolovat {{ event.name }}',
        information:
          'Podle tvých informací o ochraně osobních údajů k akci {{ event.name }} se údaje z přihlášek uchovávají {{ months }} měsíců $t(event:email.retentionDue.anchor.{{anchor}}). Tato doba končí {{ dueAt }}.',
        action:
          'Projdi přihlášky a smaž, co už nepotřebuješ. Jen ty víš, co je potřeba uchovat dál.',
        exceptions:
          'Tvoje informace o ochraně osobních údajů uvádějí i výjimky, které se uchovávají déle. Ty ponech.',
        consentBound:
          'Údaje založené na souhlasu se smějí uchovávat, dokud souhlas platí. Jakmile ho někdo odvolá, bez odkladu je smaž.',
        noAutomaticDeletion:
          'Nic nebylo smazáno automaticky. Údaje akcí nikdy nemažeme sami — rozhodnutí je na tobě.',
        button: 'Otevřít akci',
      },
      // Pulled into the sentence above by nesting: the payload carries the
      // catalogue key, not a phrase.
      anchor: {
        event_end: 'po skončení akce',
        submission: 'po odeslání přihlášky',
      },
      footer: {
        cause: '$t(email:footer.cause) můžeš tuto akci smazat.',
      },
    },
  },
};
