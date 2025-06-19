import { recurse } from "cypress-recurse";

Cypress.Commands.add("getBySel", (selector, ...args) => {
  return cy.get(`[data-test=${selector}]`, ...args);
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
