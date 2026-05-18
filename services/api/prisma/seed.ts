import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

const hashApiKey = (apiKey: string): string => createHash("sha256").update(apiKey).digest("hex");

async function main() {
  const devApiKey = process.env.DEV_API_KEY ?? "dev_avatar_platform_key";

  await prisma.client.upsert({
    where: { slug: "demo" },
    update: {
      apiKeyHash: hashApiKey(devApiKey),
      status: "active"
    },
    create: {
      name: "Demo Client",
      slug: "demo",
      apiKeyHash: hashApiKey(devApiKey),
      allowedOrigins: ["http://localhost:5173", "http://localhost:5174"],
      status: "active"
    }
  });

  console.log("Seeded Demo Client with hashed local dev API key.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
