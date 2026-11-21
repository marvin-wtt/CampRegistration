export default {
  email: {
    confirmation: {
      subject: 'Confirm your newsletter subscription',
      preview: 'One click to start receiving “{{ newsletter }}”.',
      text: {
        title: 'Confirm your subscription',
        information:
          '{{ organization }} would like to add you to the newsletter “{{ newsletter }}”. Confirm your subscription to receive news and updates by email.',
        button: 'Confirm subscription',
        accidental:
          'Didn’t sign up? Just ignore this email. You won’t be subscribed, and your address is deleted after 30 days.',
      },
      footer: {
        cause:
          '$t(email:footer.cause) {{ organization }} added you to their newsletter.',
      },
    },
    reason: '$t(email:footer.cause) you subscribed to this newsletter.',
    unsubscribe: 'Unsubscribe',
  },
};
