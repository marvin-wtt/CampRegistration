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
          'Poprawienie zarejestrowanych danych ponownie kieruje ją do weryfikacji.',
        reasonLabel: 'Powód',
        button: 'Sprawdź dane',
        greeting: 'Pozdrawiamy,',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) zarządzasz tą organizacją.',
      },
    },
    priceModelOffered: {
      subject: 'Nowe ceny dla {{ organization.name }}',
      preview: 'Zaakceptuj nowy model cenowy do {{ date }}',
      text: {
        title: 'Zaakceptuj nowe ceny',
        information:
          'Od {{ date }} {{ organization.name }} przechodzi na model cenowy {{ model.name }}: {{ model.price }} za zgłoszenie plus opłata podstawowa {{ model.baseFee }}, w tym {{ model.taxRate }} % podatku. Utworzone już wydarzenia zachowują swoje ceny. Dopóki nie zaakceptujesz, od {{ date }} nie możesz tworzyć nowych wydarzeń. Możesz zaakceptować lub odrzucić na stronie rozliczeń.',
        button: 'Zobacz ceny',
        greeting: 'Pozdrawiamy,',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) zarządzasz tą organizacją.',
      },
    },
    priceModelLowered: {
      subject: 'Niższe ceny dla {{ organization.name }}',
      preview: '{{ organization.name }} płaci teraz mniej',
      text: {
        title: 'Twoje ceny spadły',
        information:
          '{{ organization.name }} korzysta teraz z modelu cenowego {{ model.name }}: {{ model.price }} za zgłoszenie plus opłata podstawowa {{ model.baseFee }}, w tym {{ model.taxRate }} % podatku. Dotyczy wydarzeń tworzonych od teraz. Nic nie zdrożało, więc nie trzeba niczego akceptować.',
        button: 'Otwórz rozliczenia',
        greeting: 'Pozdrawiamy,',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) zarządzasz tą organizacją.',
      },
    },
    invoiceIssued: {
      subject: 'Faktura za {{ event.name }}',
      preview: '{{ amount }} za {{ event.name }}',
      text: {
        title: 'Nowa faktura jest gotowa',
        information:
          'Faktura za {{ event.name }} jest gotowa: {{ amount }}. ' +
          'Możesz ją pobrać na stronie rozliczeń organizacji {{ organization.name }}.',
        button: 'Otwórz rozliczenia',
        greeting: 'Pozdrawiamy,',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) zarządzasz tą organizacją.',
      },
    },
  },
};
