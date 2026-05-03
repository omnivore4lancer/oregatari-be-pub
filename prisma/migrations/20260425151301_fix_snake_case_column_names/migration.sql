-- User: createdAt → created_at
ALTER TABLE "User" RENAME COLUMN "createdAt" TO "created_at";

-- Post: authorId → author_id, createdAt → created_at
ALTER TABLE "Post" RENAME COLUMN "authorId" TO "author_id";
ALTER TABLE "Post" RENAME COLUMN "createdAt" TO "created_at";

-- stories: worldSetting → world_setting, additionalElements → additional_elements, eraBg → era_bg
ALTER TABLE "stories" RENAME COLUMN "worldSetting" TO "world_setting";
ALTER TABLE "stories" RENAME COLUMN "additionalElements" TO "additional_elements";
ALTER TABLE "stories" RENAME COLUMN "eraBg" TO "era_bg";
