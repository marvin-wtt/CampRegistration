describe("Authentication", () => {
  before(() => {
    cy.resetDatabase();
  });

  beforeEach(() => {
    cy.truncateDatabase();
    cy.seedDatabase();

    cy.clearEmails();
  });

  describe("Login", () => {
    it("should log in with valid credentials", () => {
      cy.intercept("POST", `/api/v1/auth/login`).as("loginUser");

      cy.visit("/login");

      const loginForm = cy.getBySel("login-form");
      loginForm.getBySel("email").type("john@example.com");
      loginForm.getBySel("password").type("password");
      loginForm.getBySel("remember").click();
      loginForm.getBySel("submit").click();

      cy.wait("@loginUser").its("response.statusCode").should("eq", 200);

      cy.location("pathname").should("eq", "/management");
    });

    it("should show error for invalid credentials", () => {
      cy.intercept("POST", `/api/v1/auth/login`).as("loginUser");

      cy.visit("/login");

      const loginForm = cy.getBySel("login-form");
      loginForm.getBySel("email").type("john@example.com");
      loginForm.getBySel("password").type("invalid-password");
      loginForm.getBySel("remember").click();
      loginForm.getBySel("submit").click();

      cy.wait("@loginUser").its("response.statusCode").should("eq", 400);

      loginForm.getBySel("error").should("be.visible");
    });

    it("should log in with totp", () => {
      cy.intercept("POST", `/api/v1/auth/login`).as("loginUser");
      cy.intercept("POST", `/api/v1/auth/verify-otp`).as("verifyTotp");

      cy.visit("/login");

      const loginForm = cy.getBySel("login-form");
      loginForm.getBySel("email").type("admin@email.com");
      loginForm.getBySel("password").type("admin-password");
      loginForm.getBySel("remember").click();
      loginForm.getBySel("submit").click();

      cy.wait("@loginUser").its("response.statusCode").should("eq", 403);
      cy.location("pathname").should("eq", "/verify-otp");

      const totpForm = cy.getBySel("totp-form");
      cy.generateTotp("JBSWY3DPEHPK3PXP").then((totp) => {
        totpForm.getBySel("totp").get("input").first().type(totp);
      });
      totpForm.getBySel("submit").click();

      cy.wait("@verifyTotp").its("response.statusCode").should("eq", 200);

      cy.location("pathname").should("eq", "/management");
    });

    it("should show error for invalid totp", () => {
      cy.intercept("POST", `/api/v1/auth/login`).as("loginUser");
      cy.intercept("POST", `/api/v1/auth/verify-otp`).as("verifyTotp");

      cy.visit("/login");

      const loginForm = cy.getBySel("login-form");
      loginForm.getBySel("email").type("admin@email.com");
      loginForm.getBySel("password").type("admin-password");
      loginForm.getBySel("remember").click();
      loginForm.getBySel("submit").click();

      cy.wait("@loginUser").its("response.statusCode").should("eq", 403);
      cy.location("pathname").should("eq", "/verify-otp");

      const totpForm = cy.getBySel("totp-form");
      totpForm.getBySel("totp").get("input").first().type("000000");
      totpForm.getBySel("submit").click();

      cy.wait("@verifyTotp").its("response.statusCode").should("eq", 400);
      totpForm.getBySel("error").should("be.visible");
    });
  });

  describe("Registration", () => {
    it("should register a new user", () => {
      cy.intercept("POST", `/api/v1/auth/register`).as("registerUser");

      cy.visit("/register");

      const registrationForm = cy.getBySel("registration-form");
      registrationForm.getBySel("name").type("Test User");
      registrationForm.getBySel("email").type("test@example.com");
      registrationForm.getBySel("password").type("Password123#");
      registrationForm.getBySel("confirm-password").type("Password123#");
      registrationForm.getBySel("submit").click();

      cy.wait("@registerUser").its("response.statusCode").should("eq", 201);
      cy.location("pathname").should("eq", "/login");

      cy.log("Verifying email sent to user");

      cy.getEmails("test@example.com").then((emails) => {
        expect(emails).to.have.length(1);
        const email = emails[0];

        expect(email.headers.subject).to.include("Welcome to Our Service");
        expect(email.body).to.include("Thank you for registering, Test User!");
      });
    });
  });
});
