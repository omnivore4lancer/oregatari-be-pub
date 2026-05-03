-- AlterTable
ALTER TABLE "episodes" DROP COLUMN IF EXISTS "image_prompt";

-- AlterTable
ALTER TABLE "episode_pages" ADD COLUMN IF NOT EXISTS "image_prompt" TEXT;
