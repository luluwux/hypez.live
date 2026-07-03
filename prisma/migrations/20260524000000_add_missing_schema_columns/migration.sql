-- ─── PremiumTier: add TOKEN value ────────────────────────────────────────────
ALTER TYPE "PremiumTier" ADD VALUE IF NOT EXISTS 'TOKEN';

-- ─── Server: missing columns ─────────────────────────────────────────────────
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "weeklyVoiceMinutes"     INTEGER          NOT NULL DEFAULT 0;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "weeklyMessageCount"     INTEGER          NOT NULL DEFAULT 0;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "voiceChannelCount"      INTEGER          NOT NULL DEFAULT 0;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "premiumExpiresAt"       TIMESTAMP(3);
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "isVisible"              BOOLEAN          NOT NULL DEFAULT true;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "isToken"                BOOLEAN          NOT NULL DEFAULT false;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "isBlacklisted"          BOOLEAN          NOT NULL DEFAULT false;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "blacklistReason"        TEXT;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "isFlagged"              BOOLEAN          NOT NULL DEFAULT false;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "totalHypes"             INTEGER          NOT NULL DEFAULT 0;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "lastVoterId"            TEXT;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "lastVotedAt"            TIMESTAMP(3);
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "leaderboardChannelId"   TEXT;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "leaderboardMessageId"   TEXT;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "inviteUrl"              TEXT;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "weeklyHypeScore"        DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "totalHypeScore"         DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "version"                INTEGER          NOT NULL DEFAULT 0;

-- ─── User: missing columns ───────────────────────────────────────────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banner"        TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trustScore"    INTEGER          NOT NULL DEFAULT 50;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "occupation"    TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender"        TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location"      TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birthday"      TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "about"         TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "socialLinks"   JSONB;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isPublished"   BOOLEAN          NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "badges"        TEXT[]           NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileViews"  INTEGER          NOT NULL DEFAULT 0;

-- ─── HypeVote ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "HypeVote" (
    "id"       TEXT NOT NULL,
    "userId"   TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "weekYear" TEXT NOT NULL,
    "usedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HypeVote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HypeVote_userId_weekYear_idx"  ON "HypeVote"("userId", "weekYear");
CREATE INDEX IF NOT EXISTS "HypeVote_serverId_weekYear_idx" ON "HypeVote"("serverId", "weekYear");
CREATE INDEX IF NOT EXISTS "HypeVote_userId_usedAt_idx"    ON "HypeVote"("userId", "usedAt");
ALTER TABLE "HypeVote" DROP CONSTRAINT IF EXISTS "HypeVote_serverId_fkey";
ALTER TABLE "HypeVote" ADD  CONSTRAINT "HypeVote_serverId_fkey"
    FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── ProfileLike ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "profile_likes" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "likerId"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profile_likes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "profile_likes_userId_likerId_key" ON "profile_likes"("userId", "likerId");
ALTER TABLE "profile_likes" DROP CONSTRAINT IF EXISTS "profile_likes_userId_fkey";
ALTER TABLE "profile_likes" ADD  CONSTRAINT "profile_likes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── AuditLog ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id"        TEXT NOT NULL,
    "adminId"   TEXT NOT NULL,
    "action"    TEXT NOT NULL,
    "entityId"  TEXT,
    "details"   TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AuditLog_adminId_idx"    ON "AuditLog"("adminId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx"  ON "AuditLog"("createdAt" DESC);

-- ─── Application enums + table ───────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE "ApplicationType" AS ENUM ('PARTNER', 'VERIFIED', 'STREAMER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "applications" (
    "id"            TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "userId"        TEXT,
    "guildId"       TEXT,
    "type"          "ApplicationType"   NOT NULL,
    "status"        "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "answers"       JSONB               NOT NULL,
    "reviewedBy"    TEXT,
    "reviewNote"    TEXT,
    "cooldownUntil" TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "applications_discordUserId_idx"  ON "applications"("discordUserId");
CREATE INDEX IF NOT EXISTS "applications_status_type_idx"    ON "applications"("status", "type");
CREATE INDEX IF NOT EXISTS "applications_guildId_idx"        ON "applications"("guildId");
CREATE INDEX IF NOT EXISTS "applications_createdAt_idx"      ON "applications"("createdAt" DESC);
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_userId_fkey";
ALTER TABLE "applications" ADD  CONSTRAINT "applications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_guildId_fkey";
ALTER TABLE "applications" ADD  CONSTRAINT "applications_guildId_fkey"
    FOREIGN KEY ("guildId") REFERENCES "Server"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── BotSettings ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "bot_settings" (
    "id"               TEXT    NOT NULL DEFAULT 'global',
    "botName"          TEXT    NOT NULL DEFAULT 'Moderasyon Bot',
    "prefix"           TEXT    NOT NULL DEFAULT '!',
    "description"      TEXT             DEFAULT 'Sunucu moderasyonu ve güvenlik özellikleri sağlar',
    "token"            TEXT             DEFAULT '',
    "autoStart"        BOOLEAN NOT NULL DEFAULT true,
    "avatar"           TEXT             DEFAULT 'https://cdn.discordapp.com/embed/avatars/0.png',
    "status"           TEXT    NOT NULL DEFAULT 'ONLINE',
    "commandLogs"      BOOLEAN NOT NULL DEFAULT true,
    "errorLogs"        BOOLEAN NOT NULL DEFAULT true,
    "apiLogs"          BOOLEAN NOT NULL DEFAULT false,
    "systemLogs"       BOOLEAN NOT NULL DEFAULT true,
    "logLevel"         TEXT    NOT NULL DEFAULT 'INFO',
    "logRetentionDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt"        TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bot_settings_pkey" PRIMARY KEY ("id")
);

-- ─── BotCommand ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "bot_commands" (
    "id"          TEXT    NOT NULL,
    "name"        TEXT    NOT NULL,
    "description" TEXT    NOT NULL,
    "category"    TEXT    NOT NULL,
    "usage"       TEXT    NOT NULL,
    "cooldown"    TEXT    NOT NULL DEFAULT 'Yok',
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "useCount"    INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bot_commands_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "bot_commands_name_key" ON "bot_commands"("name");

-- ─── BotPermission ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "bot_permissions" (
    "id"          TEXT    NOT NULL,
    "key"         TEXT    NOT NULL,
    "name"        TEXT    NOT NULL,
    "description" TEXT    NOT NULL,
    "category"    TEXT    NOT NULL,
    "isDangerous" BOOLEAN NOT NULL DEFAULT false,
    "isActive"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bot_permissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "bot_permissions_key_key" ON "bot_permissions"("key");

-- ─── BotLog ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "bot_logs" (
    "id"        TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level"     TEXT NOT NULL,
    "category"  TEXT NOT NULL,
    "message"   TEXT NOT NULL,
    "user"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bot_logs_pkey" PRIMARY KEY ("id")
);

-- ─── SystemSettings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id"               TEXT    NOT NULL DEFAULT 'global',
    "siteName"         TEXT    NOT NULL DEFAULT 'Luppux',
    "siteUrl"          TEXT    NOT NULL DEFAULT 'https://luppux.com',
    "siteDescription"  TEXT    NOT NULL DEFAULT 'Discord botlarınızı kolayca yönetin ve özelleştirin',
    "adminEmail"       TEXT    NOT NULL DEFAULT 'admin@luppux.com',
    "supportEmail"     TEXT    NOT NULL DEFAULT 'support@luppux.com',
    "defaultLanguage"  TEXT    NOT NULL DEFAULT 'tr',
    "timezone"         TEXT    NOT NULL DEFAULT 'Europe/Istanbul',
    "currency"         TEXT    NOT NULL DEFAULT 'TRY',
    "maintenanceMode"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- ─── Category ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "categories" (
    "id"        TEXT    NOT NULL,
    "name"      TEXT    NOT NULL,
    "slug"      TEXT    NOT NULL,
    "emoji"     TEXT    NOT NULL DEFAULT '📁',
    "color"     TEXT    NOT NULL DEFAULT '#6366f1',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_key" ON "categories"("slug");

-- ─── Vote: add user FK if missing ────────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Vote_userId_fkey' AND table_name = 'Vote'
    ) THEN
        ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
