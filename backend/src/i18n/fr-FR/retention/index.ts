export default {
  kind: {
    sensitive: 'les données de santé et autres données sensibles',
    registrations: 'toutes les données d’inscription',
  },
  email: {
    manager: {
      upcoming: {
        subject:
          'Délai de conservation dans {{ days }} jours : {{ event.name }}',
        preview:
          'Des données de {{ event.name }} sont à supprimer le {{ date }}',
        text: {
          title: 'Un délai de conservation approche',
          information:
            'Selon les informations sur la protection des données de {{ event.name }}, $t(retention:kind.{{kindKey}}) sont supprimées au plus tard le {{ date }}. Vérifie dès maintenant si quelque chose doit être conservé plus longtemps, comme des factures ou des justificatifs pour un financeur, et gardes-en une copie hors de la plateforme. Supprime ensuite les données ou reporte le délai en indiquant un motif. Rien n’est supprimé automatiquement.',
          button: 'Ouvrir l’événement',
          greeting: 'Cordialement',
          teamName: 'L’équipe {{ appName }}',
        },
        footer: {
          cause:
            '$t(email:footer.cause) tu peux supprimer les inscriptions de cet événement.',
        },
      },
      due: {
        subject: 'Délai de conservation atteint : {{ event.name }}',
        preview:
          'Des données de {{ event.name }} étaient à supprimer le {{ date }}',
        text: {
          title: 'Un délai de conservation est atteint',
          information:
            'Le délai de conservation pour $t(retention:kind.{{kindKey}}) de {{ event.name }} est le {{ date }}. Supprime les données maintenant, ou reporte le délai en indiquant un motif si elles doivent être conservées plus longtemps. Rien n’est supprimé automatiquement.',
          button: 'Ouvrir l’événement',
          greeting: 'Cordialement',
          teamName: 'L’équipe {{ appName }}',
        },
        footer: {
          cause:
            '$t(email:footer.cause) tu peux supprimer les inscriptions de cet événement.',
        },
      },
    },
    organization: {
      due: {
        subject: 'Délai de conservation atteint : {{ event.name }}',
        preview:
          'Des données de {{ event.name }} étaient à supprimer le {{ date }}',
        text: {
          title: 'Un délai de conservation est atteint',
          information:
            'Le délai de conservation pour $t(retention:kind.{{kindKey}}) de {{ event.name }}, un événement de ton organisation, est le {{ date }}. Ses responsables ont été invités à supprimer les données ou à reporter le délai. Tu peux suivre l’état dans l’aperçu de ton organisation.',
          button: 'Ouvrir l’organisation',
          greeting: 'Cordialement',
          teamName: 'L’équipe {{ appName }}',
        },
        footer: {
          cause: '$t(email:footer.cause) tu administres cette organisation.',
        },
      },
    },
  },
};
