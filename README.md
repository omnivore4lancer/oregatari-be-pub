# oregatari-be

漫画ストーリー制作支援アプリのバックエンド API。

## 技術スタック

| 役割 | 技術 |
|---|---|
| フレームワーク | [Hono](https://hono.dev/) |
| デプロイ | Vercel (Serverless Functions) |
| ORM | Prisma 7 |
| DB | Supabase (PostgreSQL) |
| バリデーション | Zod v4 |
| テスト | Vitest |

## ディレクトリ構成

```
oregatari-be/
├── prisma/
│   ├── schema/               # マルチファイルスキーマ
│   │   ├── base.prisma       # generator & datasource
│   │   ├── user.prisma       # User モデル
│   │   └── story.prisma      # Story / Character / Episode など
│   └── migrations/           # マイグレーション履歴
├── src/
│   ├── index.ts              # ルーティング・エラーハンドリング
│   ├── routes/               # バリデーション（Zod parse）・HTTP レスポンス
│   ├── usecases/             # ビジネスロジック
│   ├── repositories/         # DB アクセス（Prisma 呼び出し）
│   ├── schemas/              # Zod スキーマ・Input 型定義
│   ├── middleware/           # 認証・ストーリー所有権チェック
│   └── lib/
│       ├── container.ts      # DI（usecase・サービスインスタンス管理）
│       ├── mastraClient.ts   # Mastra HTTP クライアント
│       ├── supabase.ts       # Supabase クライアント
│       ├── honoTypes.ts      # Hono 型定義
│       └── params.ts         # パスパラメータ変換ユーティリティ
├── scripts/
│   └── vercel-env-import.sh  # Vercel 環境変数インポートスクリプト
├── prisma.config.ts
└── .env
```

## ローカル開発

### 前提条件

- Node.js
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)
- Supabase CLI (`~/bin/supabase`)

### 起動手順

```sh
# 1. 依存パッケージインストール
npm install

# 2. Supabase 起動（モノレポルートから実行）
cd .. && supabase start && cd oregatari-be

# 3. マイグレーション実行
npx prisma migrate dev

# 4. 開発サーバー起動
vercel dev
```

サーバーが起動したら http://localhost:3000 でアクセスできます。

## 環境変数

`.env` に以下を設定します（Supabase 起動後に表示される値を使用）。

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_PUBLISHABLE_KEY="..."
SUPABASE_SECRET_KEY="..."
MASTRA_URL="http://localhost:4111"
MASTRA_SECRET="..."
CORS_ORIGIN="http://localhost:5173"
```

`MASTRA_SECRET` は BE → Mastra 間の内部通信に使う共有シークレット。`MastraClient` がすべてのリクエストに `X-Internal-Secret` ヘッダーとして付与します。Mastra 側も同じ値を設定してください。

## API エンドポイント

すべてのエンドポイントは `Authorization: Bearer <supabase-jwt>` ヘッダーによる認証が必要です。
ストーリー配下のリソース (`/stories/:storyId/*`) はそのストーリーの所有者のみアクセスできます。

| リソース | パスプレフィックス |
|---|---|
| ユーザー | `/users` |
| ジャンル | `/genres` |
| ストーリー | `/stories` |
| キャラクター | `/stories/:storyId/characters` |
| キャラクター関係 | `/stories/:storyId/character-relationships` |
| エピソード | `/stories/:storyId/episodes` |
| エピソードページ | `/stories/:storyId/episodes/:episodeId/pages` |
| 素材グループ | `/stories/:storyId/material-groups` |
| 素材 | `/stories/:storyId/materials` |
| パネル | `/stories/:storyId/panels` |
| 公開設定 | `/stories/:storyId/publish` |
| ジョブ | `/jobs` |

## DB スキーマ概要

主要モデルの関係:

```
User
└── Story (多)
    ├── Genre (多:多)
    ├── Character (多)
    │   └── CharacterRelationship (多:多)
    ├── Episode (多)
    │   ├── EpisodeCharacter (多:多 w/ Character)
    │   ├── EpisodePage (多)
    │   │   └── EpisodePageRow (多)
    │   │       └── EpisodePanel (多)
    │   └── Job (多)
    ├── MaterialGroup (多)
    │   └── Material (多)
    ├── Panel (多)
    └── PublishSettings (1)
```

## よく使うコマンド

```sh
# Prisma クライアント再生成（スキーマ変更後）
npx prisma generate

# マイグレーション作成
npx prisma migrate dev --name <migration-name>

# マイグレーション状態確認
npx prisma migrate status

# 型チェック
npx tsc --noEmit

# テスト実行
npm test

# テスト（1回実行）
npm run test:run

# Lint
npm run lint

# フォーマット
npm run format
```

## デプロイ

```sh
# プレビューデプロイ
vercel deploy

# 本番デプロイ
vercel deploy --prod
```

## 関連ドキュメント

- [アーキテクチャ詳細](ARCHITECTURE.md)
- [Claude Code 開発ガイド](CLAUDE.md)
