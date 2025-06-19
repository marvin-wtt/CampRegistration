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

      cy.log("Verifying user cannot log in before email confirmation");
      cy.getBySel("login-form").getBySel("email").type("test@example.com");
      cy.getBySel("login-form").getBySel("password").type("Password123#");
      cy.getBySel("login-form").getBySel("submit").click();

      cy.location("pathname").should("eq", "/verify-email");

      cy.log("Verifying email sent to user");
      cy.getEmails("test@example.com").then((emails) => {
        expect(emails).to.have.length(1);
        const email = emails[0];

        cy.document().document().invoke("write", email.html);
      });

      cy.get(".confirm-email-link a")
        .first()
        .invoke("removeAttr", "target")
        .click();
      cy.location("pathname").should("eq", "/login");

      cy.log("Verifying user can log in after email confirmation");
      const loginForm = cy.getBySel("login-form");
      loginForm.getBySel("password").type("Password123#");
      loginForm.getBySel("submit").click();

      cy.location("pathname").should("eq", "/management");
    });
  });

  describe("Password Reset", () => {
    it("should request password reset", () => {
      cy.intercept("POST", `/api/v1/auth/forgot-password`).as("forgotPassword");
      cy.intercept("POST", `/api/v1/auth/reset-password`).as("resetPassword");
      cy.intercept("POST", `/api/v1/auth/login`).as("loginUser");

      cy.visit("/forgot-password");

      const forgotPasswordForm = cy.getBySel("forgot-password-form");
      forgotPasswordForm.getBySel("email").type("john@example.com");
      forgotPasswordForm.getBySel("submit").click();

      cy.wait("@forgotPassword").its("response.statusCode").should("eq", 204);

      cy.getEmails("john@example.com").then((emails) => {
        expect(emails).to.have.length(1);
        const email = emails[0];

        cy.document().document().invoke("write", email.html);
      });

      cy.get(".reset-email-link a")
        .first()
        .invoke("removeAttr", "target")
        .click();
      cy.location("pathname").should("eq", "/reset-password");

      const resetPasswordForm = cy.getBySel("reset-password-form");
      resetPasswordForm.getBySel("password").type("NewPassword123#");
      resetPasswordForm.getBySel("confirm-password").type("NewPassword123#");
      resetPasswordForm.getBySel("submit").click();

      cy.wait("@resetPassword").its("response.statusCode").should("eq", 204);

      cy.location("pathname").should("eq", "/login");

      const loginForm = cy.getBySel("login-form");
      loginForm.getBySel("email").type("john@example.com");
      loginForm.getBySel("password").type("NewPassword123#");
      loginForm.getBySel("submit").click();

      cy.wait("@loginUser").its("response.statusCode").should("eq", 200);
      cy.location("pathname").should("eq", "/management");
    });
  });
});
