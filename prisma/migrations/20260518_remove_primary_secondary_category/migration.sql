-- Merge primaryCategory into categories[] if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Server' AND column_name = 'primaryCategory'
    ) THEN
        UPDATE "Server"
        SET "categories" = (
            CASE
                WHEN "primaryCategory" IS NOT NULL
                     AND NOT ("primaryCategory" = ANY("categories"))
                THEN array_append("categories", "primaryCategory")
                ELSE "categories"
            END
        )
        WHERE "primaryCategory" IS NOT NULL;
    END IF;
END $$;

-- Merge secondaryCategory into categories[] if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Server' AND column_name = 'secondaryCategory'
    ) THEN
        UPDATE "Server"
        SET "categories" = (
            CASE
                WHEN "secondaryCategory" IS NOT NULL
                     AND NOT ("secondaryCategory" = ANY("categories"))
                THEN array_append("categories", "secondaryCategory")
                ELSE "categories"
            END
        )
        WHERE "secondaryCategory" IS NOT NULL;
    END IF;
END $$;

-- Drop the columns
ALTER TABLE "Server" DROP COLUMN IF EXISTS "primaryCategory";
ALTER TABLE "Server" DROP COLUMN IF EXISTS "secondaryCategory";
