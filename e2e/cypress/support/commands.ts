Cypress.Commands.add("getBySel", (selector, ...args) => {
  return cy.get(`[data-test=${selector}]`, ...args);
});

Cypress.Commands.add("getEmails", (email) => {
  return cy.task('getEmails', email);
});

Cypress.Commands.add('clearEmails', () => {
  return cy.task('clearEmails');
});
