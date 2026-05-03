-- CreateTable
CREATE TABLE "character_relationships" (
    "id" SERIAL NOT NULL,
    "story_id" INTEGER NOT NULL,
    "from_character_id" INTEGER NOT NULL,
    "to_character_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "character_relationships_from_character_id_to_character_id_key" ON "character_relationships"("from_character_id", "to_character_id");

-- AddForeignKey
ALTER TABLE "character_relationships" ADD CONSTRAINT "character_relationships_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_relationships" ADD CONSTRAINT "character_relationships_from_character_id_fkey" FOREIGN KEY ("from_character_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_relationships" ADD CONSTRAINT "character_relationships_to_character_id_fkey" FOREIGN KEY ("to_character_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
