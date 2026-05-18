import net from "node:net";
import cors from "cors";
import express from "express";
import { avatarRoutes } from "./avatarRoutes.js";
import { config } from "./config.js";
import { prisma } from "./prisma.js";

const app = express();

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error("Timed out")), ms);
    })
  ]);

const canReachDatabaseSocket = async (): Promise<boolean> => {
  if (!config.databaseUrl) {
    return false;
  }

  const url = new URL(config.databaseUrl);
  const port = Number(url.port || 5432);

  return new Promise((resolve) => {
    const socket = net.createConnection({ host: url.hostname, port, timeout: 700 });
    const done = (result: boolean) => {
      socket.destroy();
      resolve(result);
    };

    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
};

app.use(cors());
app.use(express.json({ limit: "64kb" }));

app.get("/health", async (_request, response) => {
  let database: "ok" | "error" = "ok";

  try {
    if (!(await canReachDatabaseSocket())) {
      throw new Error("Database socket unavailable");
    }

    await withTimeout(prisma.$queryRaw`SELECT 1`, 1500);
  } catch {
    database = "error";
  }

  response.status(database === "ok" ? 200 : 503).json({
    status: database === "ok" ? "ok" : "degraded",
    service: "avatar-api",
    database
  });
});

app.use("/v1", avatarRoutes);

app.listen(config.port, () => {
  console.log(`avatar-api listening on http://localhost:${config.port}`);
});
