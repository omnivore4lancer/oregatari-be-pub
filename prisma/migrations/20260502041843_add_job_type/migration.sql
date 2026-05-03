-- CreateEnum
CREATE TYPE "job_type" AS ENUM ('image_generation', 'panel_layout');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "job_type" "job_type" NOT NULL DEFAULT 'image_generation';
