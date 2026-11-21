export default {
  email: {
    retentionDue: {
      subject: 'Kończy się okres przechowywania: {{ event.name }}',
      preview: 'Czas przejrzeć dane zgłoszeń wydarzenia {{ event.name }}',
      text: {
        title: 'Czas przejrzeć {{ event.name }}',
        information:
          'Według Twoich informacji o ochronie danych dla {{ event.name }} dane zgłoszeń są przechowywane przez {{ months }} miesięcy $t(event:email.retentionDue.anchor.{{anchor}}). Ten okres kończy się {{ dueAt }}.',
        action:
          'Przejrzyj zgłoszenia i usuń to, czego już nie potrzebujesz. Tylko Ty wiesz, co nadal trzeba przechowywać.',
        exceptions:
          'Twoje informacje o ochronie danych wymieniają też wyjątki przechowywane dłużej. Pozostaw je.',
        consentBound:
          'Dane oparte na zgodzie można przechowywać tak długo, jak zgoda obowiązuje. Usuń je niezwłocznie, gdy ktoś ją wycofa.',
        noAutomaticDeletion:
          'Nic nie zostało usunięte automatycznie. Nigdy nie usuwamy danych wydarzeń sami — decyzja należy do Ciebie.',
        button: 'Otwórz wydarzenie',
      },
      // Pulled into the sentence above by nesting: the payload carries the
      // catalogue key, not a phrase.
      anchor: {
        event_end: 'po zakończeniu wydarzenia',
        submission: 'po wysłaniu zgłoszenia',
      },
      footer: {
        cause: '$t(email:footer.cause) możesz usunąć to wydarzenie.',
      },
    },
  },
};
