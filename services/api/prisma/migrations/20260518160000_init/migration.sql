CREATE TABLE "Client" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "apiKeyHash" TEXT NOT NULL,
  "allowedOrigins" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvatarUser" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "externalUserId" TEXT NOT NULL,
  "displayName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AvatarUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Avatar" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "avatarUserId" TEXT,
  "externalUserId" TEXT,
  "publicEmbedId" TEXT NOT NULL,
  "configJson" JSONB NOT NULL,
  "previewImageUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Avatar_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvatarEvent" (
  "id" TEXT NOT NULL,
  "avatarId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AvatarEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Client_slug_key" ON "Client"("slug");
CREATE UNIQUE INDEX "Client_apiKeyHash_key" ON "Client"("apiKeyHash");
CREATE UNIQUE INDEX "AvatarUser_clientId_externalUserId_key" ON "AvatarUser"("clientId", "externalUserId");
CREATE INDEX "AvatarUser_clientId_idx" ON "AvatarUser"("clientId");
CREATE UNIQUE INDEX "Avatar_publicEmbedId_key" ON "Avatar"("publicEmbedId");
CREATE INDEX "Avatar_clientId_idx" ON "Avatar"("clientId");
CREATE INDEX "Avatar_externalUserId_idx" ON "Avatar"("externalUserId");
CREATE INDEX "Avatar_publicEmbedId_idx" ON "Avatar"("publicEmbedId");
CREATE INDEX "Avatar_status_idx" ON "Avatar"("status");
CREATE INDEX "AvatarEvent_avatarId_idx" ON "AvatarEvent"("avatarId");
CREATE INDEX "AvatarEvent_clientId_idx" ON "AvatarEvent"("clientId");
CREATE INDEX "AvatarEvent_eventType_idx" ON "AvatarEvent"("eventType");

ALTER TABLE "AvatarUser" ADD CONSTRAINT "AvatarUser_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_avatarUserId_fkey" FOREIGN KEY ("avatarUserId") REFERENCES "AvatarUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AvatarEvent" ADD CONSTRAINT "AvatarEvent_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Avatar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvatarEvent" ADD CONSTRAINT "AvatarEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
