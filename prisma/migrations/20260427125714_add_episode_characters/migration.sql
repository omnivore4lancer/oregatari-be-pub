/*
  Warnings:

  - You are about to drop the column `character_ids` on the `episodes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "episodes" DROP COLUMN "character_ids";

-- CreateTable
CREATE TABLE "episode_characters" (
    "episode_id" INTEGER NOT NULL,
    "character_id" INTEGER NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "episode_characters_pkey" PRIMARY KEY ("episode_id","character_id")
);

-- AddForeignKey
ALTER TABLE "episode_characters" ADD CONSTRAINT "episode_characters_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_characters" ADD CONSTRAINT "episode_characters_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
