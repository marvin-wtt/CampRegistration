export default {
  email: {
    reviewPending: {
      subject: 'Organization awaiting review: {{ organization.name }}',
      preview: '{{ organization.name }} is waiting to be verified',
      text: {
        title: 'A new organization needs review',
        information:
          '{{ organization.name }} has been submitted for verification. ' +
          'Until it is verified it cannot publish events or send newsletters.',
        button: 'Review organizations',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) you are an administrator.',
      },
    },
    verified: {
      subject: 'Your organization has been verified',
      preview: '{{ organization.name }} can now publish events',
      text: {
        title: 'Your organization has been verified',
        information:
          '{{ organization.name }} has been verified. ' +
          'You can now publish its events and send newsletters.',
        button: 'Open organization',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) you administer this organization.',
      },
    },
    rejected: {
      subject: 'Your organization could not be verified',
      preview: '{{ organization.name }} needs your attention',
      text: {
        title: 'Your organization could not be verified',
        information:
          '{{ organization.name }} has not been verified. ' +
          'It cannot publish events or send newsletters until it is. ' +
          'Correcting its registered details puts it back into review.',
        reasonLabel: 'Reason',
        button: 'Review the details',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) you administer this organization.',
      },
    },
    priceModelOffered: {
      subject: 'New prices for {{ organization.name }}',
      preview: 'Please accept the new price model by {{ date }}',
      text: {
        title: 'Please accept the new prices',
        information:
          "From {{ date }}, {{ organization.name }} moves to the price model {{ model.name }}: {{ model.price }} per registration plus a base fee of {{ model.baseFee }}, including {{ model.taxRate }} % tax. Events you already created keep their prices. Until you accept, you can't create new events from {{ date }} on. You can accept or decline on the billing page.",
        button: 'Review the prices',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) you administer this organization.',
      },
    },
    priceModelLowered: {
      subject: 'Lower prices for {{ organization.name }}',
      preview: '{{ organization.name }} now pays less',
      text: {
        title: 'Your prices went down',
        information:
          '{{ organization.name }} is now on the price model {{ model.name }}: {{ model.price }} per registration plus a base fee of {{ model.baseFee }}, including {{ model.taxRate }} % tax. It applies to events you create from now on. Nothing got more expensive, so there is nothing to accept.',
        button: 'Open billing',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) you administer this organization.',
      },
    },
    invoiceIssued: {
      subject: 'Invoice for {{ event.name }}',
      preview: '{{ amount }} for {{ event.name }}',
      text: {
        title: 'A new invoice is ready',
        information:
          'The invoice for {{ event.name }} is ready: {{ amount }}. ' +
          'You can download it on the billing page of {{ organization.name }}.',
        button: 'Open billing',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause: '$t(email:footer.cause) you administer this organization.',
      },
    },
  },
};
