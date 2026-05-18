import type { Response } from "express";
import { Prisma } from "@prisma/client";

export function sendError(response: Response, status: number, error: string, message: string, details?: unknown) {
  response.status(status).json({ error, message, details });
}

export function handleRouteError(response: Response, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    sendError(response, 400, "database_error", error.message);
    return;
  }

  if (error instanceof Error) {
    sendError(response, 500, "internal_error", error.message);
    return;
  }

  sendError(response, 500, "internal_error", "Unexpected server error.");
}
