-- CreateEnum
CREATE TYPE "episode_status" AS ENUM ('未公開', '公開中');

-- CreateEnum
CREATE TYPE "episode_relation" AS ENUM ('続編', '並列', '単独');

-- CreateEnum
CREATE TYPE "generating_state" AS ENUM ('generating', 'done');

-- CreateTable
CREATE TABLE "episodes" (
    "id" SERIAL NOT NULL,
    "story_id" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "episode_status" NOT NULL DEFAULT '未公開',
    "relation" "episode_relation" NOT NULL DEFAULT '単独',
    "generating_state" "generating_state" NOT NULL DEFAULT 'done',
    "parent_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_groups" (
    "id" SERIAL NOT NULL,
    "story_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "story_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "aspect_ratio" TEXT NOT NULL,
    "art_style" TEXT NOT NULL,
    "location_main" TEXT NOT NULL,
    "location_detail" TEXT,
    "world_setting" TEXT,
    "time_slot" TEXT NOT NULL,
    "weather" TEXT NOT NULL,
    "sky_desc" TEXT,
    "lighting" TEXT,
    "fg_l_structure" TEXT,
    "fg_l_texture" TEXT,
    "fg_l_furniture" TEXT,
    "fg_l_props" TEXT,
    "mg_c_ground" TEXT,
    "mg_c_decoration" TEXT,
    "mg_c_atmosphere" TEXT,
    "mg_r_structure" TEXT,
    "mg_r_items" TEXT,
    "bg_building" TEXT,
    "bg_terrain" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panels" (
    "id" TEXT NOT NULL,
    "story_id" INTEGER NOT NULL,
    "vertices" JSONB NOT NULL,
    "prompt" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publish_settings" (
    "story_id" INTEGER NOT NULL,
    "character_ids" INTEGER[],
    "visual_style" TEXT,
    "layout" TEXT,
    "description" TEXT,
    "tags" TEXT[],
    "cover_image_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publish_settings_pkey" PRIMARY KEY ("story_id")
);

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_groups" ADD CONSTRAINT "material_groups_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "material_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panels" ADD CONSTRAINT "panels_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publish_settings" ADD CONSTRAINT "publish_settings_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
