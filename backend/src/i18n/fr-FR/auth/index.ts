export default {
  email: {
    resetPassword: {
      subject: 'Réinitialiser votre mot de passe',
      preview:
        'Réinitialisez votre mot de passe maintenant pour retrouver l’accès à votre compte.',
      text: {
        title: 'Bonjour,',
        information:
          'Vous avez oublié votre mot de passe ? Pas de problème. Vous pouvez en définir un nouveau ici.',
        button: 'Réinitialiser le mot de passe',
        accidental:
          "Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet e-mail.",
        greeting: 'Cordialement,',
        teamName: 'Équipe {{ appName }}',
      },
      footer: {
        cause:
          '$t(email:footer.cause) vous avez demandé un nouveau mot de passe.',
      },
    },

    verifyEmail: {
      subject: 'Vérifiez votre e-mail',
      preview: 'Vérifiez votre e-mail pour activer votre compte.',
      text: {
        title: 'Bonjour,',
        information:
          'Veuillez confirmer votre e-mail pour confirmer que le compte vous appartient. Vous pouvez vous connecter directement après confirmation.',
        button: "Confirmer l'e-mail",
        accidental:
          "Si vous n'avez pas créé de compte, veuillez ne pas cliquer sur le lien et nous contacter.",
        greeting: 'Cordialement,',
        teamName: 'Équipe {{ appName }}',
      },
      footer: {
        cause: '$t(email:footer.cause) vous avez créé un compte.',
      },
    },
  },
};
