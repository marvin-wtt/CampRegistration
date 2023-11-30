import { beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import prisma from "../utils/prisma";
import app from "../../src/app";
import { TokenType, User } from "@prisma/client";
import { UserFactory } from "../../prisma/factories";
import { generateToken, verifyToken } from "../utils/token";

describe("/api/v1/auth", async () => {
  describe("POST /api/v1/auth/register", () => {
    it("should respond with a `201` status code when provided with details", async () => {
      const { status } = await request(app).post("/api/v1/auth/register").send({
        name: "testuser",
        email: "test@email.net",
        password: "Password1",
      });

      expect(status).toBe(201);
    });

    it("should respond with the user details when successful", async () => {
      const { body } = await request(app).post("/api/v1/auth/register").send({
        name: "testuser",
        email: "test@email.net",
        password: "Password1",
      });

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

    it("should respond with a `400` status code if an invalid email body is provided", async () => {
      const { status } = await request(app).post("/api/v1/auth/register").send({
        name: "testuser",
        email: "test(at)email.net",
        password: "Password1",
      });

      const userCount = await prisma.user.count();

      expect(status).toBe(400);
      expect(userCount).toBe(0);
    });

    it("should respond with a `400` status code if an invalid password is provided", async () => {
      const { status } = await request(app).post("/api/v1/auth/register").send({
        name: "testuser",
        email: "test@email.net",
        password: "invalid",
      });

      const userCount = await prisma.user.count();

      expect(status).toBe(400);
      expect(userCount).toBe(0);
    });

    it("should respond with a `400` status code if the email is already used", async () => {
      await UserFactory.create({
        email: "test@email.net",
        name: "test",
        password: "",
      });

      const { status } = await request(app).post("/api/v1/auth/register").send({
        name: "testuser",
        email: "test@email.net",
        password: "Password1",
      });

      const userCount = await prisma.user.count();

      expect(status).toBe(400);
      expect(userCount).toBe(1);
    });

    it("should respond with a `400` status code if the role is set in request body", async () => {
      const { status } = await request(app).post("/api/v1/auth/register").send({
        name: "testuser",
        email: "test@email.net",
        password: "Password1",
        role: "ADMIN",
      });

      const userCount = await prisma.user.count();

      expect(status).toBe(400);
      expect(userCount).toBe(0);
    });

    it("should encode the user password", async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "testuser",
        email: "test@email.net",
        password: "Password1",
      });

      const user = (await prisma.user.findFirst()) as User;

      expect(user).toBeDefined();
      expect(bcrypt.compare(user.password, "password1")).toBeTruthy();
    });

    it("should set USER role as default", async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "testuser",
        email: "test@email.net",
        password: "Password1",
      });

      const user = (await prisma.user.findFirst()) as User;

      expect(user.role).toEqual("USER");
    });

    it("should store user preferred locale when successful", async () => {
      const data = {
        name: "testuser",
        email: "test@email.net",
        password: "Password1",
      };

      const { status, body } = await request(app)
        .post("/api/v1/auth/register")
        .set("Accept-Language", "fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5")
        .send(data);

      expect(status).toBe(201);
      expect(body).toHaveProperty("locale", "fr-CH");
    });

    it("should use en-US as default locale", async () => {
      const data = {
        name: "testuser",
        email: "test@email.net",
        password: "Password1",
      };

      const { status, body } = await request(app)
        .post("/api/v1/auth/register")
        .send(data);

      expect(status).toBe(201);
      expect(body).toHaveProperty("locale", "en-US");
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
      const { status } = await request(app).post("/api/v1/auth/login").send({
        email: "test@email.net",
        password: "password",
      });
      expect(status).toBe(200);
    });

    it("should respond with a `200` status code when provided valid credentials and remember", async () => {
      const { status } = await request(app).post("/api/v1/auth/login").send({
        email: "test@email.net",
        password: "password",
        remember: true,
      });
      expect(status).toBe(200);
    });

    it("should respond with the user details when successful", async () => {
      const { body } = await request(app).post("/api/v1/auth/login").send({
        email: "test@email.net",
        password: "password",
      });

      expect(body).toHaveProperty("user.id");
    });

    it("should respond with access token", async () => {
      const { body } = await request(app).post("/api/v1/auth/login").send({
        email: "test@email.net",
        password: "password",
      });

      expect(body).toHaveProperty("tokens.access.token");
      expect(body).toHaveProperty("tokens.access.expires");

      // TODO Add assertion here
      expect(verifyToken(body.tokens.access.token));
    });

    it("should set access token as cookie when successful", async () => {
      const { headers } = await request(app).post("/api/v1/auth/login").send({
        email: "test@email.net",
        password: "password",
      });

      const setCookie = headers["set-cookie"];

      expect(setCookie).toContainEqual(expect.stringMatching(/^accessToken.*/));
    });

    it("should not set refresh token as cookie without remember", async () => {
      const { headers } = await request(app).post("/api/v1/auth/login").send({
        email: "test@email.net",
        password: "password",
      });

      const setCookie = headers["set-cookie"];

      expect(setCookie).not.toContainEqual(
        expect.stringMatching(/^refreshToken.*/),
      );
    });

    it("should respond with refresh token when remember is set when successful", async () => {
      const { body } = await request(app).post("/api/v1/auth/login").send({
        email: "test@email.net",
        password: "password",
        remember: true,
      });

      expect(body).toHaveProperty("tokens.refresh.token");
      expect(body).toHaveProperty("tokens.refresh.expires");

      // TODO Add assertion here
      expect(verifyToken(body.tokens.refresh.token));
    });

    it("should set access token and refresh token as cookie with remember when successful", async () => {
      const { headers } = await request(app).post("/api/v1/auth/login").send({
        email: "test@email.net",
        password: "password",
        remember: true,
      });

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

      const { status } = await request(app).post("/api/v1/auth/login").send({
        email: "test2@email.net",
        password: "password",
        remember: true,
      });
      expect(status).toBe(403);
    });

    it("should respond with a `400` status code when given invalid credentials", async () => {
      const { body, status } = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@email.net",
          password: "wrongpassword",
        });

      expect(status).toBe(400);
      expect(body).not.toHaveProperty("tokens");
      expect(body).not.toHaveProperty("user");
    });

    it("should respond with a `400` status code when the user cannot be found", async () => {
      const { body, status } = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@email.net",
          password: "testpassword",
        });
      expect(status).toBe(400);
      expect(body).not.toHaveProperty("token");
    });

    it("should store the refresh token when remember is set when successful", async () => {
      await request(app).post("/api/v1/auth/login").send({
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

      const { status } = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "test@email.net",
        });

      expect(status).toBe(204);
    });

    it("should respond with `204` status code when provided with invalid email", async () => {
      const { status } = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "unknown@email.net",
        });

      expect(status).toBe(204);
    });

    it("should store a token for the user when successful", async () => {
      const user = await UserFactory.create({
        email: "test@email.net",
      });

      await request(app).post("/api/v1/auth/forgot-password").send({
        email: "test@email.net",
      });

      const count = await prisma.token.count({
        where: {
          userId: user.id,
          type: TokenType.RESET_PASSWORD,
        },
      });

      expect(count).toBe(1);
    });

    it.todo("should send an email to the user when successful");
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
      context.token = generateToken(user);
    });

    it<ResetPasswordContext>("should respond with `204` status code when provided with valid token and email", async (context) => {
      const data = {
        token: context.token,
        email: context.email,
        password: "Test1234",
      };

      const { status } = await request(app)
        .post(`/api/v1/auth/reset-password/`)
        .send(data);

      expect(status).toBe(204);
    });

    it<ResetPasswordContext>("should respond with `400` status code when provided with invalid token", async (context) => {
      const data = {
        token: "SomeInvalidToken",
        email: context.email,
        password: "Test1234",
      };

      const { status } = await request(app)
        .post(`/api/v1/auth/reset-password/`)
        .send(data);

      expect(status).toBe(400);
    });

    it<ResetPasswordContext>("should respond with `400` status code when provided with invalid email", async (context) => {
      const data = {
        token: context.token,
        email: context.email,
        password: "123",
      };

      const { status } = await request(app)
        .post(`/api/v1/auth/reset-password/`)
        .send(data);

      expect(status).toBe(400);
    });

    it<ResetPasswordContext>("should respond with `400` status code when provided with invalid password", async (context) => {
      const data = {
        token: context.token,
        email: "invalid@email.net",
        password: "Test1234",
      };

      const { status } = await request(app)
        .post(`/api/v1/auth/reset-password/`)
        .send(data);

      expect(status).toBe(400);
    });

    it.todo("should send an email to the user when successful");
  });

  describe("POST /api/v1/auth/send-verification-email", () => {
    it.todo(
      "should respond with `200` status code when the user is authenticated",
    );

    it.todo(
      "should respond with `401` status code when the user unauthenticated",
    );

    it.todo("should send an email to the user when successful");
  });

  describe("POST /api/v1/auth/verify-email", () => {
    it.todo(
      "should respond with `200` status code when provided with valid token",
    );

    it.todo(
      "should respond with `400` status code when provided without token",
    );
  });
});
