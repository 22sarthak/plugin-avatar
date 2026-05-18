import {
  accessoryOptions,
  animationOptions,
  avatarTraitCategories,
  eyeColorOptions,
  eyeShapeOptions,
  faceShapeOptions,
  hairColorOptions,
  hairStyleOptions,
  outfitOptions,
  serializeAvatarConfig,
  skinToneOptions,
  validateAvatarConfig,
  type AvatarConfig
} from "@avatar-platform/avatar-core";
import type { Router } from "express";
import { Prisma } from "@prisma/client";
import express from "express";
import { createPublicEmbedId } from "./crypto.js";
import { handleRouteError, sendError } from "./http.js";
import { prisma } from "./prisma.js";
import type { AuthenticatedRequest } from "./types.js";
import { requireApiKey } from "./auth.js";

const router: Router = express.Router();

const formatPrivateAvatar = (avatar: {
  id: string;
  publicEmbedId: string;
  externalUserId: string | null;
  configJson: unknown;
  previewImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  avatarId: avatar.id,
  publicEmbedId: avatar.publicEmbedId,
  externalUserId: avatar.externalUserId,
  config: avatar.configJson as unknown as AvatarConfig,
  previewImageUrl: avatar.previewImageUrl,
  createdAt: avatar.createdAt.toISOString(),
  updatedAt: avatar.updatedAt.toISOString()
});

const parseConfigForWrite = (value: unknown) => {
  const validation = validateAvatarConfig(value);
  if (!validation.config) {
    return validation;
  }

  return {
    ...validation,
    config: JSON.parse(serializeAvatarConfig(validation.config)) as AvatarConfig
  };
};

const toPrismaJson = (config: AvatarConfig): Prisma.InputJsonValue =>
  JSON.parse(serializeAvatarConfig(config)) as Prisma.InputJsonValue;

router.get("/assets", (_request, response) => {
  response.json({
    categories: avatarTraitCategories,
    traits: {
      skinTones: skinToneOptions,
      faceShapes: faceShapeOptions,
      eyeShapes: eyeShapeOptions,
      eyeColors: eyeColorOptions,
      hairStyles: hairStyleOptions,
      hairColors: hairColorOptions,
      outfits: outfitOptions,
      accessories: accessoryOptions,
      animations: animationOptions
    }
  });
});

router.post("/avatars", requireApiKey, async (request: AuthenticatedRequest, response) => {
  try {
    if (!request.client) {
      sendError(response, 401, "missing_client", "Authenticated client context is missing.");
      return;
    }

    const validation = parseConfigForWrite(request.body?.config);
    if (!validation.config) {
      sendError(response, 400, "invalid_avatar_config", "Avatar config is invalid.", validation.errors);
      return;
    }

    const externalUserId = typeof request.body?.externalUserId === "string" && request.body.externalUserId.trim()
      ? request.body.externalUserId.trim()
      : undefined;
    const displayName = typeof request.body?.displayName === "string" && request.body.displayName.trim()
      ? request.body.displayName.trim()
      : undefined;

    const configJson = toPrismaJson(validation.config);
    const avatar = await prisma.$transaction(async (tx) => {
      const avatarUser = externalUserId
        ? await tx.avatarUser.upsert({
            where: {
              clientId_externalUserId: {
                clientId: request.client!.id,
                externalUserId
              }
            },
            update: { displayName },
            create: {
              clientId: request.client!.id,
              externalUserId,
              displayName
            }
          })
        : null;

      const created = await tx.avatar.create({
        data: {
          clientId: request.client!.id,
          avatarUserId: avatarUser?.id,
          externalUserId,
          publicEmbedId: createPublicEmbedId(),
          configJson,
          status: "active"
        }
      });

      await tx.avatarEvent.create({
        data: {
          avatarId: created.id,
          clientId: request.client!.id,
          eventType: "created",
          metadataJson: { source: "api" }
        }
      });

      return created;
    });

    response.status(201).json(formatPrivateAvatar(avatar));
  } catch (error) {
    handleRouteError(response, error);
  }
});

router.get("/avatars/:id", requireApiKey, async (request: AuthenticatedRequest, response) => {
  try {
    const avatar = await prisma.avatar.findFirst({
      where: {
        id: request.params.id,
        clientId: request.client!.id
      }
    });

    if (!avatar) {
      sendError(response, 404, "avatar_not_found", "Avatar was not found for this client.");
      return;
    }

    response.json(formatPrivateAvatar(avatar));
  } catch (error) {
    handleRouteError(response, error);
  }
});

router.put("/avatars/:id", requireApiKey, async (request: AuthenticatedRequest, response) => {
  try {
    const validation = parseConfigForWrite(request.body?.config);
    if (!validation.config) {
      sendError(response, 400, "invalid_avatar_config", "Avatar config is invalid.", validation.errors);
      return;
    }

    const existing = await prisma.avatar.findFirst({
      where: {
        id: request.params.id,
        clientId: request.client!.id
      }
    });

    if (!existing) {
      sendError(response, 404, "avatar_not_found", "Avatar was not found for this client.");
      return;
    }

    const previewImageUrl = typeof request.body?.previewImageUrl === "string" && request.body.previewImageUrl.trim()
      ? request.body.previewImageUrl.trim()
      : undefined;

    const configJson = toPrismaJson(validation.config);
    const updated = await prisma.$transaction(async (tx) => {
      const avatar = await tx.avatar.update({
        where: { id: existing.id },
        data: {
          configJson,
          ...(previewImageUrl !== undefined ? { previewImageUrl } : {})
        }
      });

      await tx.avatarEvent.create({
        data: {
          avatarId: avatar.id,
          clientId: request.client!.id,
          eventType: "updated",
          metadataJson: { source: "api" }
        }
      });

      return avatar;
    });

    response.json(formatPrivateAvatar(updated));
  } catch (error) {
    handleRouteError(response, error);
  }
});

router.get("/embed/:publicEmbedId", async (request, response) => {
  try {
    const avatar = await prisma.avatar.findFirst({
      where: {
        publicEmbedId: request.params.publicEmbedId,
        status: "active"
      }
    });

    if (!avatar) {
      sendError(response, 404, "avatar_not_found", "Public avatar was not found.");
      return;
    }

    response.json({
      publicEmbedId: avatar.publicEmbedId,
      config: avatar.configJson as unknown as AvatarConfig,
      previewImageUrl: avatar.previewImageUrl,
      updatedAt: avatar.updatedAt.toISOString()
    });
  } catch (error) {
    handleRouteError(response, error);
  }
});

export const avatarRoutes = router;
