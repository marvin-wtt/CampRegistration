export default {
  email: {
    confirmation: {
      subject: 'Please confirm your newsletter subscription',
      preview: '{{ organization }} would like to send you their newsletter.',
      text: {
        title: 'Hi,',
        information:
          '{{ organization }} would like to add you to their newsletter "{{ newsletter }}". Please confirm that you want to receive it. You will not get it until you confirm.',
        button: 'Confirm subscription',
        accidental:
          'If you did not expect this email, just ignore it. You will not be subscribed and your address will be deleted after 30 days.',
        greeting: 'Best regards,',
        teamName: '{{ appName }} team',
      },
      footer: {
        cause:
          '$t(email:footer.cause) {{ organization }} added you to their newsletter.',
      },
    },
    reason: '$t(email:footer.cause) you subscribed to our newsletter.',
    unsubscribe: 'Unsubscribe',
  },
};
