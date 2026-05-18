import { createHash, randomBytes } from "node:crypto";

export const hashApiKey = (apiKey: string): string => createHash("sha256").update(apiKey).digest("hex");

export const createPublicEmbedId = (): string => `emb_${randomBytes(12).toString("base64url")}`;
