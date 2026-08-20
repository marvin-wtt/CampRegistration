export default {
  email: {
    reviewPending: {
      subject: 'Organizacja oczekuje na sprawdzenie: {{ organization.name }}',
      preview: '{{ organization.name }} oczekuje na weryfikację',
      text: {
        title: 'Nowa organizacja wymaga sprawdzenia',
        information:
          '{{ organization.name }} została zgłoszona do weryfikacji. ' +
          'Do czasu weryfikacji nie może publikować obozów ani wysyłać newsletterów.',
        button: 'Sprawdź organizacje',
        greeting: 'Pozdrawiamy,',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) jesteś administratorem.',
      },
    },
    verified: {
      subject: 'Twoja organizacja została zweryfikowana',
      preview: '{{ organization.name }} może już publikować obozy',
      text: {
        title: 'Twoja organizacja została zweryfikowana',
        information:
          '{{ organization.name }} została zweryfikowana. ' +
          'Możesz teraz publikować jej obozy i wysyłać newslettery.',
        button: 'Otwórz organizację',
        greeting: 'Pozdrawiamy,',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) zarządzasz tą organizacją.',
      },
    },
    rejected: {
      subject: 'Twojej organizacji nie udało się zweryfikować',
      preview: '{{ organization.name }} wymaga Twojej uwagi',
      text: {
        title: 'Twojej organizacji nie udało się zweryfikować',
        information:
          '{{ organization.name }} nie została zweryfikowana. ' +
          'Do tego czasu nie może publikować obozów ani wysyłać newsletterów. ' +
          'Możesz poprawić dane i zgłosić ją ponownie.',
        reasonLabel: 'Powód',
        button: 'Sprawdź dane',
        greeting: 'Pozdrawiamy,',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) zarządzasz tą organizacją.',
      },
    },
  },
};
