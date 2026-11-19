export default {
  kind: {
    sensitive: 'dane o zdrowiu i inne dane wrażliwe',
    registrations: 'wszystkie dane zgłoszeń',
  },
  email: {
    manager: {
      upcoming: {
        subject: 'Termin przechowywania za {{ days }} dni: {{ event.name }}',
        preview: 'Dane wydarzenia {{ event.name }} należy usunąć do {{ date }}',
        text: {
          title: 'Zbliża się termin przechowywania',
          information:
            'Zgodnie z informacjami o ochronie danych wydarzenia {{ event.name }} $t(retention:kind.{{kindKey}}) są usuwane najpóźniej {{ date }}. Sprawdź teraz, czy coś trzeba przechowywać dłużej, na przykład faktury lub dokumenty dla grantodawcy, i zachowaj ich kopię poza platformą. Następnie usuń dane albo przesuń termin, podając powód. Nic nie jest usuwane automatycznie.',
          button: 'Otwórz wydarzenie',
          greeting: 'Pozdrawiamy',
          teamName: 'Zespół {{ appName }}',
        },
        footer: {
          cause:
            '$t(email:footer.cause) możesz usuwać zgłoszenia tego wydarzenia.',
        },
      },
      due: {
        subject: 'Termin przechowywania minął: {{ event.name }}',
        preview:
          'Dane wydarzenia {{ event.name }} należało usunąć do {{ date }}',
        text: {
          title: 'Termin przechowywania minął',
          information:
            'Termin przechowywania dla: $t(retention:kind.{{kindKey}}) wydarzenia {{ event.name }} to {{ date }}. Usuń dane teraz albo przesuń termin, podając powód, jeśli trzeba je przechowywać dłużej. Nic nie jest usuwane automatycznie.',
          button: 'Otwórz wydarzenie',
          greeting: 'Pozdrawiamy',
          teamName: 'Zespół {{ appName }}',
        },
        footer: {
          cause:
            '$t(email:footer.cause) możesz usuwać zgłoszenia tego wydarzenia.',
        },
      },
    },
    organization: {
      due: {
        subject: 'Termin przechowywania minął: {{ event.name }}',
        preview:
          'Dane wydarzenia {{ event.name }} należało usunąć do {{ date }}',
        text: {
          title: 'Termin przechowywania minął',
          information:
            'Termin przechowywania dla: $t(retention:kind.{{kindKey}}) wydarzenia {{ event.name }} Twojej organizacji to {{ date }}. Osoby zarządzające zostały poproszone o usunięcie danych lub przesunięcie terminu. Stan sprawdzisz w przeglądzie organizacji.',
          button: 'Otwórz organizację',
          greeting: 'Pozdrawiamy',
          teamName: 'Zespół {{ appName }}',
        },
        footer: {
          cause: '$t(email:footer.cause) administrujesz tą organizacją.',
        },
      },
    },
  },
};
