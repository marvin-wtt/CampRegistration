export default {
  email: {
    retentionDue: {
      subject: 'Kończy się okres przechowywania: {{ camp.name }}',
      preview: 'Dane zgłoszeń obozu {{ camp.name }} wymagają przeglądu',
      text: {
        title: 'Kończy się okres przechowywania',
        information: 'Informacje o ochronie danych opublikowane dla obozu {{ camp.name }} mówią zgłaszającym się, że ich dane są przechowywane przez {{ months }} miesięcy $t(camp:email.retentionDue.anchor.{{anchor}}). Dla tego obozu okres ten kończy się {{ dueAt }}.',
        action: 'Przejrzyj proszę zgłoszenia obozu i usuń to, co nie jest już potrzebne. Tylko wy możecie ocenić, co należy zachować dłużej.',
        exceptions: 'Wasze informacje o ochronie danych wskazują także wyjątki przechowywane dłużej niż ten okres. Nie usuwaj tego, co obejmują.',
        consentBound: 'Część danych jest przechowywana tak długo, jak trwa zgoda, na której się opiera. Pozostają do czasu wycofania zgody, a wtedy muszą zostać niezwłocznie usunięte.',
        noAutomaticDeletion: 'Nic nie zostało usunięte automatycznie. Ta platforma nigdy sama nie kasuje danych obozu — decyzja i działanie należą do was.',
        button: 'Otwórz obóz',
        greeting: 'Z pozdrowieniami,',
        teamName: 'Zespół {{ appName }}',
      },
      // Pulled into the sentence above by nesting: the payload carries the
      // catalogue key, not a phrase.
      anchor: {
        camp_end: 'po zakończeniu obozu',
        submission: 'po wysłaniu zgłoszenia',
      },
      footer: {
        cause: '$t(email:footer.cause) możesz usunąć ten obóz.',
      },
    },
  },
};
