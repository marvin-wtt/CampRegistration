export default {
  email: {
    managerNotification: {
      subject: 'Anmeldebenachrichtigung',
      preview: 'Neue Anmeldung für das Camp: {{ camp.name }}',
      text: {
        title: 'Hallo,',
        information:
          '{{ participantName }} hat sich für {{ camp.name }} angemeldet.',
        button: 'Anmeldungen anzeigen',
        greeting: 'Viele Grüße,',
        teamName: '$t(appName) Team',
      },
      footer: {
        cause:
          '$t(email:footer.cause) Sie eine Kontaktperson für dieses Camps sind.',
      },
    },
    waitingListConfirmation: {
      subject: 'Wartelisten-Benachrichtigung',
      preview:
        'Wartelistenbenachrichtigung für deine Anmeldung zum Camp: {{ camp.name }}',
      text: {
        title: 'Hallo {{ participantName }},',
        information:
          'Danke für deine Anmeldung zum {{ camp.name }}. ' +
          'Leider sind bereits alle Plätze vergeben. ' +
          'Deine Anmeldung steht nun auf der Warteliste. ' +
          'Wir melden uns, sobald ein Platz frei wird.',
        contact:
          'Wenn du weitere Fragen hast, zögere nicht, uns zu kontaktieren, indem du auf diese E-Mail antwortest.',
        greeting: 'Viele Grüße,',
        teamName: '$t(appName) Team',
      },
      footer: {
        cause: '$t(email:footer.cause) du dich für ein Camp angemeldet hast.',
      },
    },
    confirmation: {
      subject: 'Anmeldebestätigung',
      preview: 'Bestätigung für deine Anmeldung zum Camp: {{ camp.name }}',
      text: {
        title: 'Hallo {{ participantName }},',
        information:
          'Danke für deine Anmeldung zum {{ camp.name }}. ' +
          'Du erhältst weitere Informationen in einer separaten E-Mail.',
        contact:
          'Wenn du weitere Fragen hast, zögere nicht, uns zu kontaktieren, indem du auf diese E-Mail antwortest.',
        greeting: 'Viele Grüße,',
        teamName: '$t(appName) Team',
      },
      footer: {
        cause: '$t(email:footer.cause) du dich für ein Camp angemeldet hast.',
      },
    },
  },
};
