import * as smtpTester from 'smtp-tester'

export default (on: Cypress.PluginEvents, config: Cypress.PluginConfig) => {
  const port = 456;
  const mailServer = smtpTester.init(port);
  console.log('mail server at port %d', port);

  // [receiver email]: email text
  let receivedEmails = [];

  // process all emails
  mailServer.bind((addr, id, email) => {
    console.log('--- email to %s ---', email.headers.to);
    console.log(email.body);
    console.log('--- end ---');

    receivedEmails.push(email);
  });

  on('task', {
    clearEmails() {
      receivedEmails = [];
      return null;
    },

    getEmails(email: string) {
      // cy.task cannot return undefined
      // thus we return null as a fallback
      return receivedEmails
        .filter(value => value.headers.to.toLowerCase() === email.toLowerCase()) ?? null;
    },
  });

  return config;
};