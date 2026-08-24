export default {
  email: {
    reason: '$t(email:footer.cause) ponieważ zarejestrowałeś się na ten obóz.',
    privacyLink: 'Informacje o ochronie danych dla tego wydarzenia',
    changes: {
      cleared: 'usunięto',
      file: 'plik zaktualizowany',
    },
    managerNotification: {
      subject: 'Nowe zgłoszenie | {{ camp.name }}',
      preview: 'Nowe zgłoszenie na obóz: {{ camp.name }}',
      text: {
        title: 'Dzień dobry,',
        information:
          '{{ registration.firstName }} {{ registration.lastName }} zarejestrował(-a) się na obóz {{ camp.name }}.',
        button: 'Zobacz zgłoszenia',
        greeting: 'Pozdrawiamy,',
        teamName: 'Zespół {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) jesteś osobą kontaktową dla tego obozu.',
      },
    },
  },
};
