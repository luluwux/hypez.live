-- Fix missing cascade deletes: server deletion now cascades to Vote, HypeVote, ServerStats
-- Fix Vote.user: SET NULL on user deletion (vote history preserved, user anonymized)
-- Fix HypeVote.user: CASCADE on user deletion
-- Fix Application: SET NULL on user/server deletion
-- Remove fake placeholder Discord token default from BotSettings

-- DropForeignKey
ALTER TABLE "HypeVote" DROP CONSTRAINT "HypeVote_serverId_fkey";

-- DropForeignKey
ALTER TABLE "HypeVote" DROP CONSTRAINT "HypeVote_userId_fkey";

-- DropForeignKey
ALTER TABLE "ServerStats" DROP CONSTRAINT "ServerStats_serverId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_guildId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_userId_fkey";

-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_userId_fkey";

-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_guildId_fkey";

-- AlterTable: remove fake bot token default
ALTER TABLE "bot_settings" ALTER COLUMN "token" DROP DEFAULT;

-- AddForeignKey: Vote.server → CASCADE
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Vote.user → SET NULL (preserves vote history when user deleted)
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: HypeVote.server → CASCADE
ALTER TABLE "HypeVote" ADD CONSTRAINT "HypeVote_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: HypeVote.user → CASCADE
ALTER TABLE "HypeVote" ADD CONSTRAINT "HypeVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ServerStats.server → CASCADE
ALTER TABLE "ServerStats" ADD CONSTRAINT "ServerStats_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Application.user → SET NULL
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Application.server → SET NULL
ALTER TABLE "applications" ADD CONSTRAINT "applications_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Server"("id") ON DELETE SET NULL ON UPDATE CASCADE;
