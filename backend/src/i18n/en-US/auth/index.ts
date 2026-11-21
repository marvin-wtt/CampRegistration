export default {
  email: {
    resetPassword: {
      subject: 'Reset your password',
      preview: 'Choose a new password to get back into your account.',
      text: {
        title: 'Reset your password',
        information:
          'Forgot your password? No worries. Choose a new one with the button below.',
        button: 'Choose a new password',
        accidental:
          'Didn’t request this? Just ignore this email. Your password stays the same.',
      },
      footer: {
        cause:
          '$t(email:footer.cause) a new password was requested for your account.',
      },
    },

    verifyEmail: {
      subject: 'Confirm your email address',
      preview: 'One click and your account is ready.',
      text: {
        title: 'Confirm your email address',
        information:
          'One last step: confirm that this address is yours. You can sign in right after.',
        button: 'Confirm email address',
        accidental: 'Didn’t create an account? Just ignore this email.',
      },
      footer: {
        cause: '$t(email:footer.cause) you created an account.',
      },
    },
  },
};
