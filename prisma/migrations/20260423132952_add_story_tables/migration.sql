-- CreateEnum
CREATE TYPE "gender" AS ENUM ('男性', '女性', 'その他');

-- CreateEnum
CREATE TYPE "era" AS ENUM ('現代', '中世 / 古代', '未来 / SF');

-- CreateTable
CREATE TABLE "stories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main_characters" (
    "id" SERIAL NOT NULL,
    "story_id" INTEGER NOT NULL,
    "名前" TEXT NOT NULL,
    "性別" "gender" NOT NULL,
    "特技・能力" TEXT NOT NULL,
    "どんなキャラクターか" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "main_characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_characters" (
    "id" SERIAL NOT NULL,
    "story_id" INTEGER NOT NULL,
    "名前" TEXT NOT NULL,
    "主人公との関係" TEXT NOT NULL,
    "年齢" TEXT NOT NULL,
    "性別" TEXT NOT NULL,
    "性格" TEXT NOT NULL,
    "説明" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worlds" (
    "id" SERIAL NOT NULL,
    "時代設定" "era" NOT NULL,
    "追加要素" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worlds_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "main_characters" ADD CONSTRAINT "main_characters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_characters" ADD CONSTRAINT "sub_characters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
