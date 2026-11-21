export default {
  kind: {
    sensitive: 'dane o zdrowiu i inne dane wrażliwe',
    registrations: 'wszystkie dane zgłoszeń',
  },
  email: {
    manager: {
      upcoming: {
        subject_one:
          'Termin przechowywania za {{ count }} dzień: {{ event.name }}',
        subject_few:
          'Termin przechowywania za {{ count }} dni: {{ event.name }}',
        subject_many:
          'Termin przechowywania za {{ count }} dni: {{ event.name }}',
        subject_other:
          'Termin przechowywania za {{ count }} dnia: {{ event.name }}',
        preview: 'Czas sprawdzić dane wydarzenia {{ event.name }}',
        text: {
          title: 'Czas sprawdzić wydarzenie {{ event.name }}',
          information:
            'Twoje informacje o ochronie danych wydarzenia {{ event.name }} obiecują usunąć $t(retention:kind.{{kindKey}}) najpóźniej {{ date }}. Zachowaj poza platformą kopię tego, czego jeszcze potrzebujesz, na przykład faktur lub dokumentów dla grantodawcy. Następnie usuń dane albo przesuń termin, podając powód. Nic nie jest usuwane automatycznie.',
          button: 'Otwórz wydarzenie',
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
          title: 'Minął termin przechowywania dla {{ event.name }}',
          information:
            'Twoje informacje o ochronie danych wydarzenia {{ event.name }} obiecują usunąć $t(retention:kind.{{kindKey}}) najpóźniej {{ date }}. Usuń dane teraz albo przesuń termin, podając powód, jeśli musisz je przechowywać dłużej. Nic nie jest usuwane automatycznie.',
          button: 'Otwórz wydarzenie',
        },
        footer: {
          cause:
            '$t(email:footer.cause) możesz usuwać zgłoszenia tego wydarzenia.',
        },
      },
    },
  },
};
