import { test, expect } from "../support/fixtures";
import { generateTotp } from "../support/totp";
import { waitForMessageBySentTo } from "../support/maildev";

test.describe("Authentication", () => {
  test.describe("Login", () => {
    test("should log in with valid credentials", async ({ page }) => {
      await page.goto("/login");

      const loginForm = page.getByTestId("login-form");
      await loginForm.getByTestId("email").fill("john@example.com");
      await loginForm.getByTestId("password").fill("password");
      await loginForm.getByTestId("remember").click();

      const loginResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/auth/login") &&
          resp.request().method() === "POST",
      );
      await loginForm.getByTestId("submit").click();
      expect((await loginResponse).status()).toBe(200);

      await expect(page).toHaveURL(/\/management\/camps$/);
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/login");

      const loginForm = page.getByTestId("login-form");
      await loginForm.getByTestId("email").fill("john@example.com");
      await loginForm.getByTestId("password").fill("invalid-password");
      await loginForm.getByTestId("remember").click();

      const loginResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/auth/login") &&
          resp.request().method() === "POST",
      );
      await loginForm.getByTestId("submit").click();
      expect((await loginResponse).status()).toBe(400);

      await expect(loginForm.getByTestId("error")).toBeVisible();
    });

    test("should log in with totp", async ({ page }) => {
      await page.goto("/login");

      const loginForm = page.getByTestId("login-form");
      await loginForm.getByTestId("email").fill("admin@email.com");
      await loginForm.getByTestId("password").fill("admin-password");
      await loginForm.getByTestId("remember").click();

      const loginResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/auth/login") &&
          resp.request().method() === "POST",
      );
      await loginForm.getByTestId("submit").click();
      expect((await loginResponse).status()).toBe(403);

      await expect(page).toHaveURL(/\/verify-otp$/);

      const totpForm = page.getByTestId("totp-form");
      const totp = await generateTotp("TMRUI6PADI7DGPJF5DPMLCWSXW32MKXM");
      await totpForm
        .getByTestId("totp")
        .locator("input")
        .first()
        .pressSequentially(totp);

      const verifyResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/auth/verify-otp") &&
          resp.request().method() === "POST",
      );
      await totpForm.getByTestId("submit").click();
      expect((await verifyResponse).status()).toBe(200);

      await expect(page).toHaveURL(/\/management\/camps$/);
    });

    test("should show error for invalid totp", async ({ page }) => {
      await page.goto("/login");

      const loginForm = page.getByTestId("login-form");
      await loginForm.getByTestId("email").fill("admin@email.com");
      await loginForm.getByTestId("password").fill("admin-password");
      await loginForm.getByTestId("remember").click();

      const loginResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/auth/login") &&
          resp.request().method() === "POST",
      );
      await loginForm.getByTestId("submit").click();
      expect((await loginResponse).status()).toBe(403);

      await expect(page).toHaveURL(/\/verify-otp$/);

      const totpForm = page.getByTestId("totp-form");
      await totpForm
        .getByTestId("totp")
        .locator("input")
        .first()
        .pressSequentially("000000");

      const verifyResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/auth/verify-otp") &&
          resp.request().method() === "POST",
      );
      await totpForm.getByTestId("submit").click();
      expect((await verifyResponse).status()).toBe(400);

      await expect(totpForm.getByTestId("error")).toBeVisible();
    });
  });

  test.describe("Registration", () => {
    test("should register a new user", async ({ page }) => {
      await page.goto("/register");

      const registrationForm = page.getByTestId("registration-form");
      await registrationForm.getByTestId("name").fill("Test User");
      await registrationForm.getByTestId("email").fill("test@example.com");
      await registrationForm.getByTestId("password").fill("Password123#");
      await registrationForm
        .getByTestId("confirm-password")
        .fill("Password123#");

      const registerResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/auth/register") &&
          resp.request().method() === "POST",
      );
      await registrationForm.getByTestId("submit").click();
      expect((await registerResponse).status()).toBe(201);

      await expect(page).toHaveURL(/\/login$/);

      await page
        .getByTestId("login-form")
        .getByTestId("email")
        .fill("test@example.com");
      await page
        .getByTestId("login-form")
        .getByTestId("password")
        .fill("Password123#");
      await page.getByTestId("login-form").getByTestId("submit").click();

      await expect(page).toHaveURL(/\/verify-email$/);

      const email = await waitForMessageBySentTo("test@example.com");
      await page.setContent(email.html);

      const confirmLink = page.locator(".confirm-email-link a").first();
      await confirmLink.evaluate((el) => el.removeAttribute("target"));
      await confirmLink.click();
      await expect(page).toHaveURL(/\/login(\?|$)/);

      const loginForm = page.getByTestId("login-form");
      await loginForm.getByTestId("password").fill("Password123#");
      await loginForm.getByTestId("submit").click();

      await expect(page).toHaveURL(/\/management\/camps$/);
    });
  });

  test.describe("Password Reset", () => {
    test("should request password reset", async ({ page }) => {
      await page.goto("/forgot-password");

      const forgotPasswordForm = page.getByTestId("forgot-password-form");
      await forgotPasswordForm.getByTestId("email").fill("john@example.com");

      const forgotPasswordResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/auth/forgot-password") &&
          resp.request().method() === "POST",
      );
      await forgotPasswordForm.getByTestId("submit").click();
      expect((await forgotPasswordResponse).status()).toBe(204);

      const email = await waitForMessageBySentTo("john@example.com");
      await page.setContent(email.html);

      const resetLink = page.locator(".reset-email-link a").first();
      await resetLink.evaluate((el) => el.removeAttribute("target"));
      await resetLink.click();
      await expect(page).toHaveURL(/\/reset-password(\?|$)/);

      const resetPasswordForm = page.getByTestId("reset-password-form");
      await resetPasswordForm.getByTestId("password").fill("NewPassword123#");
      await resetPasswordForm
        .getByTestId("confirm-password")
        .fill("NewPassword123#");

      const resetPasswordResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/auth/reset-password") &&
          resp.request().method() === "POST",
      );
      await resetPasswordForm.getByTestId("submit").click();
      expect((await resetPasswordResponse).status()).toBe(204);

      await expect(page).toHaveURL(/\/login$/);

      const loginForm = page.getByTestId("login-form");
      await loginForm.getByTestId("email").fill("john@example.com");
      await loginForm.getByTestId("password").fill("NewPassword123#");

      const loginResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/auth/login") &&
          resp.request().method() === "POST",
      );
      await loginForm.getByTestId("submit").click();
      expect((await loginResponse).status()).toBe(200);

      await expect(page).toHaveURL(/\/management\/camps$/);
    });
  });
});
