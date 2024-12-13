describe("camp", () => {
  beforeEach(() => {
    cy.task("defaults:db");
    cy.visit("/");
  });
});
