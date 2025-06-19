import { recurse } from "cypress-recurse";

Cypress.Commands.add("getBySel", (selector, ...args) => {
  return cy.get(`[data-test=${selector}]`, ...args);
});

Cypress.Commands.add("getEmails", (email) => {
  return cy.task("getEmails", email);
});

Cypress.Commands.add("waitForEmails", (email) => {
  return recurse(
    // getter: attempt to fetch the last email (or null)
    () => cy.task("getEmails", email),
    // condition: stop when we have a message object
    (msg) => msg !== null && Array.isArray(msg) && msg.length > 0,
    {
      delay: 500,
      limit: 10,
      log: true,
    },
  );
});

Cypress.Commands.add("clearEmails", () => {
  return cy.task("clearEmails");
});

Cypress.Commands.add("generateTotp", (secret) => {
  return cy.task("generateTotp", secret);
});

Cypress.Commands.add("resetDatabase", () => {
  return cy.exec("npm run db:reset -w ../backend");
});

Cypress.Commands.add("truncateDatabase", () => {
  return cy.exec("npm run db:truncate -w ../backend");
});

Cypress.Commands.add("seedDatabase", () => {
  return cy.exec("npm run db:seed -w ../backend");
});
