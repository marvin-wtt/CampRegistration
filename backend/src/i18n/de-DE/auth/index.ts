export default {
  email: {
    resetPassword: {
      subject: "Passwort zurücksetzen",
      text: {
        title: "Hallo,",
        information:
          "Haben Sie Ihr Passwort vergessen? Kein Problem. Sie können hier ein neues festlegen.",
        button: "Passwort zurücksetzen",
        accidental:
          "Wenn Sie keine Passwortrücksetzung angefordert haben, können Sie diese E-Mail ignorieren.",
        greeting: "Viele Grüße,",
        teamName: "$t(appName) Team",
      },
      footer: {
        cause:
          "$t(email:footer.cause) Sie wurden von einem anderen Benutzer eingeladen.",
      },
    },

    verifyEmail: {
      subject: "Bestätigen Sie Ihre E-Mail",
      text: {
        title: "Hallo,",
        information:
          "Bitte bestätigen Sie Ihre E-Mail, um sicherzustellen, dass das Konto Ihnen gehört. Sie können sich nach der Bestätigung direkt anmelden.",
        button: "E-Mail bestätigen",
        accidental:
          "Wenn Sie kein Konto erstellt haben, klicken Sie bitte nicht auf den Link und kontaktieren Sie uns.",
        greeting: "Viele Grüße,",
        teamName: "$t(appName) Team",
      },
      footer: {
        cause: "$t(email:footer.cause) Sie haben ein Konto erstellt.",
      },
    },
  },
};
