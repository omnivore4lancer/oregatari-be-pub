-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "image_prompt" TEXT;

-- CreateTable
CREATE TABLE "episode_pages" (
    "id" SERIAL NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "page_number" INTEGER NOT NULL,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_page_rows" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER NOT NULL,
    "row_number" INTEGER NOT NULL,
    "height_ratio" TEXT NOT NULL,
    "layout_type" TEXT NOT NULL,

    CONSTRAINT "episode_page_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_panels" (
    "id" SERIAL NOT NULL,
    "row_id" INTEGER NOT NULL,
    "panel_order" INTEGER NOT NULL,
    "page_position" TEXT,
    "description" TEXT,
    "camera_angle" TEXT,
    "perspective_intensity" TEXT,
    "depth_layers" JSONB NOT NULL DEFAULT '{}',
    "background" TEXT,
    "characters" JSONB NOT NULL DEFAULT '[]',
    "effects" TEXT[],
    "lens_and_lighting" TEXT,
    "frame" TEXT NOT NULL DEFAULT 'normal',
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "image_prompt" TEXT,
    "image_url" TEXT,

    CONSTRAINT "episode_panels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "episode_pages_episode_id_page_number_key" ON "episode_pages"("episode_id", "page_number");

-- CreateIndex
CREATE UNIQUE INDEX "episode_page_rows_page_id_row_number_key" ON "episode_page_rows"("page_id", "row_number");

-- CreateIndex
CREATE UNIQUE INDEX "episode_panels_row_id_panel_order_key" ON "episode_panels"("row_id", "panel_order");

-- AddForeignKey
ALTER TABLE "episode_pages" ADD CONSTRAINT "episode_pages_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_page_rows" ADD CONSTRAINT "episode_page_rows_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "episode_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_panels" ADD CONSTRAINT "episode_panels_row_id_fkey" FOREIGN KEY ("row_id") REFERENCES "episode_page_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
