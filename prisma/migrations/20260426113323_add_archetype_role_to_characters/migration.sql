-- CreateEnum
CREATE TYPE "archetype_role" AS ENUM ('メンター', 'シャドウ', 'ヘラルド', 'シェイプシフター');

-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "archetype_role" "archetype_role";
