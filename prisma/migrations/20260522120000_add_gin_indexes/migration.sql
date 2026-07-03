-- Add pg_trgm extension for fast LIKE/ILIKE operations
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for categories array
CREATE INDEX IF NOT EXISTS idx_server_categories_gin 
ON "Server" USING GIN (categories);

-- Create GIN indexes with pg_trgm for fields that use contains: insensitive
CREATE INDEX IF NOT EXISTS idx_server_name_trgm 
ON "Server" USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_server_description_trgm 
ON "Server" USING GIN (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_user_name_trgm 
ON "users" USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_user_email_trgm 
ON "users" USING GIN (email gin_trgm_ops);
