-- AlterTable
ALTER TABLE "episodes" ADD COLUMN     "character_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
