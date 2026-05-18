import "dotenv/config";

export const config = {
  port: Number(process.env.API_PORT ?? process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  devApiKey: process.env.DEV_API_KEY ?? "dev_avatar_platform_key"
};
