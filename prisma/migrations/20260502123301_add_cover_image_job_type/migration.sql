-- AlterEnum
ALTER TYPE "job_type" ADD VALUE 'cover_image';

-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_episode_id_fkey";

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "story_id" INTEGER,
ALTER COLUMN "episode_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
