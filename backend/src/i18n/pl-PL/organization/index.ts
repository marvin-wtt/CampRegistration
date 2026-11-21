export default {
  email: {
    reviewPending: {
      subject: 'Organizacja czeka na weryfikację: {{ organization.name }}',
      preview: '{{ organization.name }} czeka na weryfikację',
      text: {
        title: 'Nowa organizacja do sprawdzenia',
        information:
          '{{ organization.name }} czeka na weryfikację. ' +
          'Do tego czasu nie może publikować wydarzeń ani wysyłać newsletterów.',
        button: 'Sprawdź organizację',
      },
      footer: {
        cause: '$t(email:footer.cause) jesteś administratorem.',
      },
    },
    verified: {
      subject: 'Twoja organizacja jest zweryfikowana',
      preview: '{{ organization.name }} może teraz publikować wydarzenia',
      text: {
        title: '{{ organization.name }} jest zweryfikowana',
        information:
          'Dobra wiadomość: możesz teraz publikować wydarzenia i wysyłać newslettery.',
        button: 'Otwórz organizację',
      },
      footer: {
        cause: '$t(email:footer.cause) zarządzasz tą organizacją.',
      },
    },
    rejected: {
      subject: 'Nie udało się zweryfikować Twojej organizacji',
      preview: '{{ organization.name }} wymaga Twojej uwagi',
      text: {
        title: 'Nie udało się zweryfikować {{ organization.name }}',
        information:
          'Dopóki nie zostanie zweryfikowana, nie może publikować wydarzeń ani wysyłać newsletterów. ' +
          'Zaktualizuj jej dane, a sprawdzimy ją ponownie.',
        reasonLabel: 'Powód',
        button: 'Zaktualizuj dane',
      },
      footer: {
        cause: '$t(email:footer.cause) zarządzasz tą organizacją.',
      },
    },
  },
};
