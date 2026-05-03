-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('running', 'done', 'failed');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "status" "job_status" NOT NULL DEFAULT 'running';
