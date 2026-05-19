import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { defaultAvatarConfig } from "@avatar-platform/avatar-core";
import { createApp } from "../src/app.js";
import { hashApiKey } from "../src/crypto.js";
import { prisma } from "../src/prisma.js";

const runIntegration = process.env.RUN_API_INTEGRATION_TESTS === "1";
const integrationDescribe = runIntegration ? describe : describe.skip;

const apiKey = "test_avatar_platform_key";
const clientSlug = `test-client-${process.pid}`;
const app = createApp();

integrationDescribe("avatar API integration", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.client.upsert({
      where: { slug: clientSlug },
      update: {
        apiKeyHash: hashApiKey(apiKey),
        status: "active"
      },
      create: {
        name: "Test Client",
        slug: clientSlug,
        apiKeyHash: hashApiKey(apiKey),
        allowedOrigins: ["http://localhost:5173"],
        status: "active"
      }
    });
  });

  afterAll(async () => {
    await prisma.client.deleteMany({ where: { slug: clientSlug } });
    await prisma.$disconnect();
  });

  it("returns health with database status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "avatar-api",
      database: "ok"
    });
  });

  it("rejects unauthorized writes", async () => {
    const response = await request(app).post("/v1/avatars").send({ config: defaultAvatarConfig });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("missing_api_key");
  });

  it("creates, loads, updates, and publicly embeds a valid avatar", async () => {
    const created = await request(app)
      .post("/v1/avatars")
      .set("x-avatar-api-key", apiKey)
      .send({
        externalUserId: "external-user-1",
        displayName: "External User",
        config: defaultAvatarConfig
      });

    expect(created.status).toBe(201);
    expect(created.body.avatarId).toEqual(expect.any(String));
    expect(created.body.publicEmbedId).toMatch(/^emb_/);

    const loaded = await request(app)
      .get(`/v1/avatars/${created.body.avatarId}`)
      .set("x-avatar-api-key", apiKey);

    expect(loaded.status).toBe(200);
    expect(loaded.body.publicEmbedId).toBe(created.body.publicEmbedId);

    const updatedConfig = {
      ...defaultAvatarConfig,
      id: "updated-avatar",
      animation: "wave",
      updatedAt: new Date().toISOString()
    };
    const updated = await request(app)
      .put(`/v1/avatars/${created.body.avatarId}`)
      .set("x-avatar-api-key", apiKey)
      .send({ config: updatedConfig, previewImageUrl: "https://example.com/avatar.png" });

    expect(updated.status).toBe(200);
    expect(updated.body.config.animation).toBe("wave");
    expect(updated.body.previewImageUrl).toBe("https://example.com/avatar.png");

    const embedded = await request(app).get(`/v1/embed/${created.body.publicEmbedId}`);

    expect(embedded.status).toBe(200);
    expect(embedded.body).toEqual({
      publicEmbedId: created.body.publicEmbedId,
      config: expect.objectContaining({ id: "updated-avatar", animation: "wave" }),
      previewImageUrl: "https://example.com/avatar.png",
      updatedAt: expect.any(String)
    });
    expect(embedded.body).not.toHaveProperty("avatarId");
    expect(embedded.body).not.toHaveProperty("clientId");
    expect(embedded.body).not.toHaveProperty("events");
    expect(JSON.stringify(embedded.body)).not.toContain("apiKey");
  });

  it("rejects invalid avatar configs", async () => {
    const response = await request(app)
      .post("/v1/avatars")
      .set("x-avatar-api-key", apiKey)
      .send({
        config: {
          ...defaultAvatarConfig,
          hairStyle: "license-unsafe-hair"
        }
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("invalid_avatar_config");
  });
});
