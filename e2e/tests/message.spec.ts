import { test, expect } from "../support/fixtures";
import { waitForMessageBySentTo } from "../support/maildev";

test.describe("message", () => {
  test("should send a message to a registration and deliver it by email", async ({
    page,
  }) => {
    const campId = "01JHP0CXJFR4MQS8SF1HQJCY38";

    await page.goto("/login");
    const loginForm = page.getByTestId("login-form");
    await loginForm.getByTestId("email").fill("john@example.com");
    await loginForm.getByTestId("password").fill("password");
    await loginForm.getByTestId("submit").click();
    await expect(page).toHaveURL(/\/management\/camps$/);

    await page.goto(`/management/camps/${campId}/contact`);

    const contactForm = page.getByTestId("contact-form");

    const toField = contactForm.getByTestId("to");
    await toField.click();

    const toValue = "Tom";

    const dialog = page.getByRole("dialog");
    if (await dialog.isVisible()) {
      await dialog.locator("input").fill(toValue);
    } else {
      await toField.locator("input").fill(toValue);
    }

    await page.getByText("Tom Smith", { exact: true }).click();

    if (await dialog.isVisible()) {
      // Close the dialog.
      await page.keyboard.press("Escape");
    }

    const replyToInput = contactForm.getByTestId("reply-to").locator("input");
    await replyToInput.clear();
    await replyToInput.fill("test@email.com");

    const subjectField = contactForm.getByTestId("subject");
    await subjectField.click();
    await subjectField
      .locator('[contenteditable="true"]')
      .pressSequentially("Welcome to camp");

    const messageField = contactForm.getByTestId("message");
    await messageField.click();
    await messageField
      .locator('[contenteditable="true"]')
      .pressSequentially("See you soon!");

    const createMessageResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/v1/camps/${campId}/messages`) &&
        resp.request().method() === "POST",
    );
    await contactForm.getByTestId("send").click();
    const response = await createMessageResponse;

    expect(response.status()).toBe(201);

    const email = await waitForMessageBySentTo("tom.smith@example.com");
    expect(email.subject).toBe("Welcome to camp");
    expect(email.text).toContain("See you soon!");
  });
});
