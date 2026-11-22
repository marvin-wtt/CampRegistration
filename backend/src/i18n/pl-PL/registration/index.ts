export default {
  email: {
    reason: '$t(email:footer.cause) zgłoszono Cię na to wydarzenie.',
    privacyLink: 'Informacje o ochronie danych dla tego wydarzenia',
    changes: {
      cleared: 'usunięto',
      file: 'plik zaktualizowany',
      sensitive: 'zmieniono',
    },
    managerNotification: {
      subject: 'Nowe zgłoszenie | {{ event.name }}',
      preview: 'Nowe zgłoszenie na {{ event.name }}',
      text: {
        title: 'Nowe zgłoszenie',
        information:
          '{{ registration.firstName }} {{ registration.lastName }} właśnie zgłosił(a) się na {{ event.name }}.',
        button: 'Pokaż zgłoszenia',
      },
      footer: {
        cause:
          '$t(email:footer.cause) jesteś osobą kontaktową dla tego wydarzenia.',
      },
    },
    messageBounced: {
      subject: 'Wiadomość niedostarczona | {{ event.name }}',
      preview:
        'Nie udało się dostarczyć wiadomości do {{ recipient }} dla {{ event.name }}',
      text: {
        title: 'Twoja wiadomość nie została dostarczona',
        information:
          'Nie udało się dostarczyć „{{ messageSubject }}” do {{ recipient }} dla {{ event.name }}. Sprawdź adres e-mail tego zgłoszenia.',
        button: 'Pokaż zgłoszenia',
      },
      footer: {
        cause:
          '$t(email:footer.cause) jesteś osobą kontaktową dla tego wydarzenia.',
      },
    },
  },
};
