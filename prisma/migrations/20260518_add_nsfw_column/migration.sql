-- Add nsfw column to Server table
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "nsfw" BOOLEAN NOT NULL DEFAULT false;
