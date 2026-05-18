import type { NextFunction, Response } from "express";
import { hashApiKey } from "./crypto.js";
import { prisma } from "./prisma.js";
import type { AuthenticatedRequest } from "./types.js";

export async function requireApiKey(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) {
  const apiKey = request.header("x-avatar-api-key");

  if (!apiKey) {
    response.status(401).json({ error: "missing_api_key", message: "x-avatar-api-key header is required." });
    return;
  }

  const client = await prisma.client.findUnique({
    where: { apiKeyHash: hashApiKey(apiKey) }
  });

  if (!client || client.status !== "active") {
    response.status(401).json({ error: "invalid_api_key", message: "API key is invalid or inactive." });
    return;
  }

  request.client = client;
  next();
}
