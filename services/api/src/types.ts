import type { Client } from "@prisma/client";
import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  client?: Client;
}
