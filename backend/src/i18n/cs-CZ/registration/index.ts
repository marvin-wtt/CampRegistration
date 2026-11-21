export default {
  email: {
    reason: '$t(email:footer.cause) jsi přihlášen(a) na tuto akci.',
    privacyLink: 'Informace o ochraně osobních údajů pro tuto akci',
    changes: {
      cleared: 'odstraněno',
      file: 'soubor aktualizován',
    },
    managerNotification: {
      subject: 'Nová přihláška | {{ event.name }}',
      preview: 'Nová přihláška na {{ event.name }}',
      text: {
        title: 'Nová přihláška',
        information:
          '{{ registration.firstName }} {{ registration.lastName }} se právě přihlásil/a na {{ event.name }}.',
        button: 'Zobrazit přihlášky',
      },
      footer: {
        cause: '$t(email:footer.cause) jsi kontaktní osobou této akce.',
      },
    },
    messageBounced: {
      subject: 'Zpráva nedoručena | {{ event.name }}',
      preview:
        'Zprávu pro {{ recipient }} k akci {{ event.name }} se nepodařilo doručit',
      text: {
        title: 'Tvoje zpráva nebyla doručena',
        information:
          '„{{ messageSubject }}“ pro {{ recipient }} k akci {{ event.name }} se nepodařilo doručit. Zkontroluj e-mailovou adresu této přihlášky.',
        button: 'Zobrazit přihlášky',
      },
      footer: {
        cause: '$t(email:footer.cause) jsi kontaktní osobou této akce.',
      },
    },
  },
};
