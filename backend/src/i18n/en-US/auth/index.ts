export default {
  email: {
    resetPassword: {
      subject: 'Reset password',
      text: {
        title: 'Hey there,',
        information:
          'You forgot your password? No problem. You can set a new one here.',
        button: 'Reset password',
        accidental:
          'If you did not request a password reset, you can ignore this email.',
        greeting: 'Best regards,',
        teamName: '$t(appName) team',
      },
      footer: {
        cause: '$t(email:footer.cause) you were invited by another user.',
      },
    },

    verifyEmail: {
      subject: 'Verify your email',
      text: {
        title: 'Hey there,',
        information:
          'Please confirm your email to confirm the account belongs to you. You can login directly after confirmation',
        button: 'Confirm email',
        accidental:
          'If you did not create an account, please do not click the link and contact us.',
        greeting: 'Best regards,',
        teamName: '$t(appName) team',
      },
      footer: {
        cause: '$t(email:footer.cause) you created an account.',
      },
    },
  },
};
