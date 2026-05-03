/*
  Warnings:

  - You are about to drop the column `storyTypes` on the `stories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stories" DROP COLUMN "storyTypes";

-- CreateTable
CREATE TABLE "genres" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_genres" (
    "story_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    CONSTRAINT "story_genres_pkey" PRIMARY KEY ("story_id","genre_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");

-- AddForeignKey
ALTER TABLE "story_genres" ADD CONSTRAINT "story_genres_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_genres" ADD CONSTRAINT "story_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
