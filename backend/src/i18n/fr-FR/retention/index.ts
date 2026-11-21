export default {
  kind: {
    sensitive: 'les données de santé et autres données sensibles',
    registrations: 'toutes les données d’inscription',
  },
  email: {
    manager: {
      upcoming: {
        subject_one:
          'Délai de conservation dans {{ count }} jour : {{ event.name }}',
        subject_other:
          'Délai de conservation dans {{ count }} jours : {{ event.name }}',
        preview: 'C’est le moment de vérifier les données de {{ event.name }}',
        text: {
          title: 'C’est le moment de vérifier {{ event.name }}',
          information:
            'Tes informations sur la protection des données de {{ event.name }} promettent de supprimer $t(retention:kind.{{kindKey}}) au plus tard le {{ date }}. Garde hors de la plateforme une copie de ce dont tu as encore besoin, comme des factures ou des justificatifs pour un financeur. Supprime ensuite les données ou reporte le délai en indiquant un motif. Rien n’est supprimé automatiquement.',
          button: 'Ouvrir l’événement',
        },
        footer: {
          cause:
            '$t(email:footer.cause) tu peux supprimer les inscriptions de cet événement.',
        },
      },
      due: {
        subject: 'Délai de conservation atteint : {{ event.name }}',
        preview:
          'Les données de {{ event.name }} étaient à supprimer le {{ date }}',
        text: {
          title: 'Délai de conservation atteint pour {{ event.name }}',
          information:
            'Tes informations sur la protection des données de {{ event.name }} promettent de supprimer $t(retention:kind.{{kindKey}}) au plus tard le {{ date }}. Supprime les données maintenant, ou reporte le délai en indiquant un motif si tu dois les conserver plus longtemps. Rien n’est supprimé automatiquement.',
          button: 'Ouvrir l’événement',
        },
        footer: {
          cause:
            '$t(email:footer.cause) tu peux supprimer les inscriptions de cet événement.',
        },
      },
    },
  },
};
