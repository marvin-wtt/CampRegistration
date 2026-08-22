export default {
  email: {
    retentionDue: {
      subject: 'Končí doba uchování: {{ camp.name }}',
      preview: 'Přihlášky tábora {{ camp.name }} je třeba projít',
      text: {
        title: 'Končí doba uchování',
        information:
          'Informace o ochraně osobních údajů zveřejněné k táboru {{ camp.name }} říkají přihlášeným, že se jejich údaje uchovávají {{ months }} měsíců $t(camp:email.retentionDue.anchor.{{anchor}}). U tohoto tábora tato doba končí {{ dueAt }}.',
        action:
          'Projdi prosím přihlášky tábora a smaž, co už není potřeba. Jen vy dokážete posoudit, co je třeba uchovat dál.',
        exceptions:
          'Vaše informace o ochraně osobních údajů uvádějí také výjimky, které se uchovávají déle. Nemaž, co spadá pod ně.',
        consentBound:
          'Některé údaje se uchovávají tak dlouho, dokud trvá souhlas, na kterém stojí. Zůstávají, dokud osoba souhlas neodvolá, a pak musí být bez zbytečného odkladu smazány.',
        noAutomaticDeletion:
          'Nic nebylo smazáno automaticky. Tato platforma nikdy nemaže údaje tábora sama — rozhodnutí i provedení jsou na vás.',
        button: 'Otevřít tábor',
        greeting: 'S pozdravem,',
        teamName: 'Tým {{ appName }}',
      },
      // Pulled into the sentence above by nesting: the payload carries the
      // catalogue key, not a phrase.
      anchor: {
        camp_end: 'po skončení tábora',
        submission: 'po odeslání přihlášky',
      },
      footer: {
        cause: '$t(email:footer.cause) můžeš tento tábor smazat.',
      },
    },
  },
};
