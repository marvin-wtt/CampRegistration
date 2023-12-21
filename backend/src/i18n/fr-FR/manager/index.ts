export default {
  email: {
    invitation: {
      subject: "Invitation au camp",
      preview: "Tu as été invité à gérer {{ camp.name }}",
      text: {
        title: "Salut,",
        information:
          "Tu as été invité à gérer {{ camp.name }}." +
          "Si tu possèdes déjà un compte, le camp sera disponible automatiquement." +
          "Sinon, crée d'abord un compte gratuit.",
        button: "Gérer le camp",
        greeting: "Bien à toi,",
        teamName: "Équipe $t(appName)",
      },
      footer: {
        cause:
          "$t(email:footer.cause) Tu as été invité par un autre utilisateur.",
      },
    },
  },
};
