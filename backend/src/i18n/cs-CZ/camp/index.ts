export default {
  email: {
    retentionDue: {
      subject: 'Končí doba uchování: {{ camp.name }}',
      preview: 'Přihlášky akce {{ camp.name }} je třeba projít',
      text: {
        title: 'Končí doba uchování',
        information:
          'Informace o ochraně osobních údajů zveřejněné k akci {{ camp.name }} říkají přihlášeným, že se jejich údaje uchovávají {{ months }} měsíců $t(camp:email.retentionDue.anchor.{{anchor}}). U této akce tato doba končí {{ dueAt }}.',
        action:
          'Projdi prosím přihlášky akce a smaž, co už není potřeba. Jen vy dokážete posoudit, co je třeba uchovat dál.',
        exceptions:
          'Vaše informace o ochraně osobních údajů uvádějí také výjimky, které se uchovávají déle. Nemaž, co spadá pod ně.',
        consentBound:
          'Některé údaje se uchovávají tak dlouho, dokud trvá souhlas, na kterém stojí. Zůstávají, dokud osoba souhlas neodvolá, a pak musí být bez zbytečného odkladu smazány.',
        noAutomaticDeletion:
          'Nic nebylo smazáno automaticky. Tato platforma nikdy nemaže údaje akce sama — rozhodnutí i provedení jsou na vás.',
        button: 'Otevřít akci',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      // Pulled into the sentence above by nesting: the payload carries the
      // catalogue key, not a phrase.
      anchor: {
        camp_end: 'po skončení akce',
        submission: 'po odeslání přihlášky',
      },
      footer: {
        cause: '$t(email:footer.cause) můžeš tuto akci smazat.',
      },
    },
  },
};
