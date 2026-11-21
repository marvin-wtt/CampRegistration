export default {
  email: {
    resetPassword: {
      subject: 'Réinitialise ton mot de passe',
      preview:
        'Choisis un nouveau mot de passe pour retrouver l’accès à ton compte.',
      text: {
        title: 'Réinitialise ton mot de passe',
        information:
          'Mot de passe oublié ? Pas de souci. Choisis-en un nouveau avec le bouton ci-dessous.',
        button: 'Choisir un nouveau mot de passe',
        accidental:
          'Tu n’as rien demandé ? Ignore simplement cet e-mail. Ton mot de passe reste inchangé.',
      },
      footer: {
        cause:
          '$t(email:footer.cause) un nouveau mot de passe a été demandé pour ton compte.',
      },
    },

    verifyEmail: {
      subject: 'Confirme ton adresse e-mail',
      preview: 'Un clic et ton compte est prêt.',
      text: {
        title: 'Confirme ton adresse e-mail',
        information:
          'Dernière étape : confirme que cette adresse t’appartient. Tu pourras te connecter juste après.',
        button: 'Confirmer l’adresse e-mail',
        accidental:
          'Tu n’as pas créé de compte ? Ignore simplement cet e-mail.',
      },
      footer: {
        cause: '$t(email:footer.cause) tu as créé un compte.',
      },
    },
  },
};
