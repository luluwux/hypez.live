-- Vote_userId_guildId_key already exists in the database (created in the
-- initial migration). This migration registers it in the Prisma schema so
-- the generated client exposes the userId_guildId compound unique key.
CREATE UNIQUE INDEX IF NOT EXISTS "Vote_userId_guildId_key" ON "Vote"("userId", "guildId");
