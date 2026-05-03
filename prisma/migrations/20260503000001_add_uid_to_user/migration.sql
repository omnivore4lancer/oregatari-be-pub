-- Add uid column as nullable first to handle existing rows
ALTER TABLE "User" ADD COLUMN "uid" TEXT;

-- Delete existing rows that have no uid (test data)
DELETE FROM "User" WHERE "uid" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "User" ALTER COLUMN "uid" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_uid_key" ON "User"("uid");
