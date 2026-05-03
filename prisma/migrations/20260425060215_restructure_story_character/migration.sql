/*
  Warnings:

  - You are about to drop the `main_characters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sub_characters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `worlds` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `era` to the `stories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `worldSetting` to the `stories` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "main_characters" DROP CONSTRAINT "main_characters_story_id_fkey";

-- DropForeignKey
ALTER TABLE "sub_characters" DROP CONSTRAINT "sub_characters_story_id_fkey";

-- AlterTable
ALTER TABLE "stories" ADD COLUMN     "additionalElements" TEXT,
ADD COLUMN     "climax" TEXT,
ADD COLUMN     "conclusion" TEXT,
ADD COLUMN     "dev" TEXT,
ADD COLUMN     "era" "era" NOT NULL,
ADD COLUMN     "eraBg" TEXT,
ADD COLUMN     "intro" TEXT,
ADD COLUMN     "storyTypes" TEXT[],
ADD COLUMN     "worldSetting" TEXT NOT NULL;

-- DropTable
DROP TABLE "main_characters";

-- DropTable
DROP TABLE "sub_characters";

-- DropTable
DROP TABLE "worlds";

-- DropEnum
DROP TYPE "gender";

-- CreateTable
CREATE TABLE "characters" (
    "id" SERIAL NOT NULL,
    "story_id" INTEGER NOT NULL,
    "is_protagonist" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "age" TEXT,
    "gender" TEXT,
    "overview" TEXT,
    "appearance" TEXT,
    "personality" TEXT,
    "motivation" TEXT,
    "background" TEXT,
    "skills" TEXT[],
    "avatar_color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
