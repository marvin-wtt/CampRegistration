import { beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import prisma from "../utils/prisma";
import { TokenType, User } from "@prisma/client";
import { CampFactory, UserFactory } from "../../prisma/factories";
import {
  generateAccessToken,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  verifyToken,
} from "../utils/token";
import { request } from "../utils/request";
import { TokenFactory } from "../../prisma/factories/token";
import { receiveEmail } from "../utils/mail-server";
import { CampManagerFactory } from "../../prisma/factories/manager";
import { InvitationFactory } from "../../prisma/factories/invitation";

describe("/api/v1/auth", async () => {
  describe("POST /api/v1/auth/register", () => {
    it("should respond with a `201` status code when provided with details", async () => {
      await request()
        .post("/api/v1/auth/register")
        .send({
          name: "testuser",
          email: "test@email.net",
          password: "Password1",
        })
        .expect(201);
    });

    it("should respond with the user details when successful", async () => {
      const { body } = await request()
        .post("/api/v1/auth/register")
        .send({
          name: "testuser",
          email: "test@email.net",
          password: "Password1",
        })
        .expect(201);

      const newUser = await prisma.user.findFirst();

      expect(newUser).not.toBeNull();
      expect(body).toStrictEqual({
        id: newUser?.id,
        email: "test@email.net",
        name: "testuser",
        locale: expect.anything(),
        emailVerified: false,
      });
    });

    it("should make the user camp manager if the user has pending invitations", async () => {
      await CampManagerFactory.create({
        camp: { create: CampFactory.build() },
        invitation: {
          create: InvitationFactory.build({
            email: "test@email.net",
          }),
        },
      });

      await request()
        .post("/api/v1/auth/register")
        .send({
          name: "testuser",
          email: "test@email.net",
          password: "Password1",
        })
        .expect(201);

      const manager = await prisma.campManager.findFirst({
        where: {
          user: {
            email: "test@email.net",
          },
        },
        include: {
          invitation: true,
        },
      });

      expect(manager).toBeDefined();
      expect(manager?.invitation).toBeNull();
    });

    it("should respond with a `400` status code if an invalid email body is provided", async () => {
      await request()
        .post("/api/v1/auth/register")
        .send({
          name: "testuser",
          email: "test(at)email.net",
          password: "Password1",
        })
        .expect(400);

      const userCount = await prisma.user.count();
      expect(userCount).toBe(0);
    });

    it("should respond with a `400` status code if an invalid password is provided", async () => {
      await request()
        .post("/api/v1/auth/register")
        .send({
          name: "testuser",
          email: "test@email.net",
          password: "invalid",
        })
        .expect(400);

      const userCount = await prisma.user.count();

      expect(userCount).toBe(0);
    });

    it("should respond with a `400` status code if the email is already used", async () => {
      await UserFactory.create({
        email: "test@email.net",
        name: "test",
        password: "",
      });

      await request()
        .post("/api/v1/auth/register")
        .send({
          name: "testuser",
          email: "test@email.net",
          password: "Password1",
        })
        .expect(400);

      const userCount = await prisma.user.count();

      expect(userCount).toBe(1);
    });

    it("should respond with a `400` status code if the role is set in request body", async () => {
      await request()
        .post("/api/v1/auth/register")
        .send({
          name: "testuser",
          email: "test@email.net",
          password: "Password1",
          role: "ADMIN",
        })
        .expect(400);

      const userCount = await prisma.user.count();

      expect(userCount).toBe(0);
    });

    it("should encode the user password", async () => {
      await request()
        .post("/api/v1/auth/register")
        .send({
          name: "testuser",
          email: "test@email.net",
          password: "Password1",
        })
        .expect(201);

      const user = (await prisma.user.findFirst()) as User;

      expect(user).toBeDefined();
      expect(bcrypt.compare(user.password, "password1")).toBeTruthy();
    });

    it("should set USER role as default", async () => {
      await request()
        .post("/api/v1/auth/register")
        .send({
          name: "testuser",
          email: "test@email.net",
          password: "Password1",
        })
        .expect(201);

      const user = (await prisma.user.findFirst()) as User;

      expect(user.role).toEqual("USER");
    });

    it("should store user preferred locale when successful", async () => {
      const data = {
        name: "testuser",
        email: "test@email.net",
        password: "Password1",
      };

      const { body } = await request()
        .post("/api/v1/auth/register")
        .set("Accept-Language", "fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5")
        .send(data)
        .expect(201);

      expect(body).toHaveProperty("locale", "fr-CH");
    });

    it("should use en-US as default locale", async () => {
      const data = {
        name: "testuser",
        email: "test@email.net",
        password: "Password1",
      };

      const { body } = await request()
        .post("/api/v1/auth/register")
        .send(data)
        .expect(201);

      expect(body).toHaveProperty("locale", "en-US");
    });

    it("should send a welcome notification to the user", async () => {
      const data = {
        name: "testuser",
        email: "test@email.net",
        password: "Password1",
      };

      await request().post("/api/v1/auth/register").send(data).expect(201);

      await receiveEmail("test@email.net");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await UserFactory.create({
        name: "testuser",
        email: "test@email.net",
        password: bcrypt.hashSync("password", 8),
      });
    });

    it("should respond with a `200` status code when provided valid credentials", async () => {
      await request()
        .post("/api/v1/auth/login")
        .send({
          email: "test@email.net",
          password: "password",
        })
        .expect(200);
    });

    it("should respond with a `200` status code when provided valid credentials and remember", async () => {
      await request()
        .post("/api/v1/auth/login")
        .send({
          email: "test@email.net",
          password: "password",
          remember: true,
        })
        .expect(200);
    });

    it("should respond with the user details when successful", async () => {
      const { body } = await request()
        .post("/api/v1/auth/login")
        .send({
          email: "test@email.net",
          password: "password",
        })
        .expect(200);

      expect(body).toHaveProperty("user.id");
    });

    it("should respond with access token", async () => {
      const { body } = await request()
        .post("/api/v1/auth/login")
        .send({
          email: "test@email.net",
          password: "password",
        })
        .expect(200);

      expect(body).toHaveProperty("tokens.access.token");
      expect(body).toHaveProperty("tokens.access.expires");

      expect(verifyToken(body.tokens.access.token)).toBeDefined();
    });

    it("should set access token as cookie when successful", async () => {
      const { headers } = await request()
        .post("/api/v1/auth/login")
        .send({
          email: "test@email.net",
          password: "password",
        })
        .expect(200);

      const setCookie = headers["set-cookie"];

      expect(setCookie).toContainEqual(expect.stringMatching(/^accessToken.*/));
    });

    it("should not set refresh token as cookie without remember", async () => {
      const { headers } = await request()
        .post("/api/v1/auth/login")
        .send({
          email: "test@email.net",
          password: "password",
        })
        .expect(200);

      const setCookie = headers["set-cookie"];

      expect(setCookie).not.toContainEqual(
        expect.stringMatching(/^refreshToken.*/),
      );
    });

    it("should respond with refresh token when remember is set when successful", async () => {
      const { body } = await request()
        .post("/api/v1/auth/login")
        .send({
          email: "test@email.net",
          password: "password",
          remember: true,
        })
        .expect(200);

      expect(body).toHaveProperty("tokens.refresh.token");
      expect(body).toHaveProperty("tokens.refresh.expires");

      expect(verifyToken(body.tokens.refresh.token)).toBeDefined();
    });

    it("should set access token and refresh token as cookie with remember when successful", async () => {
      const { headers } = await request()
        .post("/api/v1/auth/login")
        .send({
          email: "test@email.net",
          password: "password",
          remember: true,
        })
        .expect(200);

      const setCookie = headers["set-cookie"];

      expect(setCookie).toContainEqual(expect.stringMatching(/^accessToken.*/));
      expect(setCookie).toContainEqual(
        expect.stringMatching(/^refreshToken.*/),
      );
    });

    it("should respond with a `403` status code when email is not verified", async () => {
      await UserFactory.create({
        email: "test2@email.net",
        emailVerified: false,
        password: bcrypt.hashSync("password", 8),
      });

      await request()
        .post("/api/v1/auth/login")
        .send({
          email: "test2@email.net",
          password: "password",
          remember: true,
        })
        .expect(403);
    });

    it("should respond with a `400` status code when given invalid credentials", async () => {
      const { body } = await request()
        .post("/api/v1/auth/login")
        .send({
          email: "test@email.net",
          password: "wrongpassword",
        })
        .expect(400);

      expect(body).not.toHaveProperty("tokens");
      expect(body).not.toHaveProperty("user");
    });

    it("should respond with a `400` status code when the user cannot be found", async () => {
      const { body } = await request()
        .post("/api/v1/auth/login")
        .send({
          email: "test@email.net",
          password: "testpassword",
        })
        .expect(400);

      expect(body).not.toHaveProperty("token");
    });

    it("should store the refresh token when remember is set when successful", async () => {
      await request().post("/api/v1/auth/login").send({
        email: "test@email.net",
        password: "password",
        remember: true,
      });

      const tokenCount = await prisma.token.count({
        where: {
          type: TokenType.REFRESH,
        },
      });

      expect(tokenCount).toBe(1);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it.todo(
      "should respond with a `200` status code when the user is authenticated",
    );

    it.todo(
      "should respond with a `401` status code when the user unauthenticated",
    );

    it.todo("should delete the refresh token when successful");

    it.todo("should remove access and refresh token cookie when successful");
  });

  describe("POST /api/v1/auth/refresh-tokens", () => {
    it.todo(
      "should respond with a `200` status code when the user is authenticated",
    );

    it.todo(
      "should respond with a new access and refresh token when successful",
    );

    it.todo("should respond with a access and refresh cookie when successful");

    it.todo("should store the new refresh token when successful");

    it.todo(
      "should respond with `400` status code when the user has no refresh token",
    );

    it.todo(
      "should respond with `401` status code when the user is unauthenticated",
    );
  });

  describe("POST /api/v1/auth/forgot-password", () => {
    it("should respond with `204` status code when provided with valid email", async () => {
      await UserFactory.create({
        email: "test@email.net",
      });

      await request()
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "test@email.net",
        })
        .expect(204);
    });

    it("should respond with `204` status code when provided with invalid email", async () => {
      await request()
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "unknown@email.net",
        })
        .expect(204);
    });

    it("should store a token for the user when successful", async () => {
      const user = await UserFactory.create({
        email: "test@email.net",
      });

      await request()
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "test@email.net",
        })
        .expect(204);

      const count = await prisma.token.count({
        where: {
          userId: user.id,
          type: TokenType.RESET_PASSWORD,
        },
      });

      expect(count).toBe(1);
    });

    it("should send an email to the user when successful", async () => {
      await UserFactory.create({
        email: "test@email.net",
      });

      await request()
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "test@email.net",
        })
        .expect(204);

      await receiveEmail("test@email.net");
    });
  });

  describe("POST /api/v1/auth/reset-password", () => {
    type ResetPasswordContext = {
      email: string;
      token: string;
    };

    beforeEach<ResetPasswordContext>(async (context) => {
      const email = "test@email.net";
      const user = await UserFactory.create({ email });

      context.email = email;
      context.token = generateResetPasswordToken(user);

      await TokenFactory.create({
        user: {
          connect: {
            id: user.id,
          },
        },
        token: context.token,
        type: TokenType.RESET_PASSWORD,
        blacklisted: false,
      });
    });

    it<ResetPasswordContext>("should respond with `204` status code when provided with valid token and email", async (context) => {
      const data = {
        token: context.token,
        email: context.email,
        password: "Test1234",
      };

      await request()
        .post(`/api/v1/auth/reset-password/`)
        .send(data)
        .expect(204);
    });

    it<ResetPasswordContext>("should respond with `400` status code when provided with invalid token", async (context) => {
      const data = {
        token: "SomeInvalidToken",
        email: context.email,
        password: "Test1234",
      };

      await request()
        .post(`/api/v1/auth/reset-password/`)
        .send(data)
        .expect(400);
    });

    it<ResetPasswordContext>("should respond with `400` status code when provided with invalid email", async (context) => {
      const data = {
        token: context.token,
        email: context.email,
        password: "123",
      };

      await request()
        .post(`/api/v1/auth/reset-password/`)
        .send(data)
        .expect(400);
    });

    it<ResetPasswordContext>("should respond with `400` status code when provided with invalid password", async (context) => {
      const data = {
        token: context.token,
        email: "invalid@email.net",
        password: "Test1234",
      };

      await request()
        .post(`/api/v1/auth/reset-password/`)
        .send(data)
        .expect(400);
    });
  });

  describe("POST /api/v1/auth/send-verification-email", () => {
    it("should respond with `204` status code when the user is authenticated", async () => {
      const user = await UserFactory.create({
        emailVerified: false,
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post(`/api/v1/auth/send-verification-email/`)
        .send()
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(204);
    });

    it("should respond with `401` status code when the user is unauthenticated", async () => {
      await request()
        .post(`/api/v1/auth/send-verification-email/`)
        .send()
        .expect(401);
    });

    it("should send an email to the user when successful", async () => {
      const user = await UserFactory.create({
        emailVerified: false,
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post(`/api/v1/auth/send-verification-email/`)
        .send()
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(204);

      await receiveEmail(user.email);
    });
  });

  describe("POST /api/v1/auth/verify-email", () => {
    it("should respond with `204` status code when provided with valid token", async () => {
      const user = await UserFactory.create();
      const token = generateVerifyEmailToken(user);
      await TokenFactory.create({
        user: { connect: { id: user.id } },
        type: TokenType.VERIFY_EMAIL,
        token,
      });

      const data = {
        token,
      };

      await request().post(`/api/v1/auth/verify-email/`).send(data).expect(204);
    });

    it("should respond with `400` status code when provided without token", async () => {
      const user = await UserFactory.create();
      await TokenFactory.create({
        user: { connect: { id: user.id } },
        type: TokenType.VERIFY_EMAIL,
        token: generateVerifyEmailToken(user),
      });
      const token = generateVerifyEmailToken(user);

      const data = {
        token,
      };

      await request().post(`/api/v1/auth/verify-email/`).send(data).expect(204);
    });
  });
});
