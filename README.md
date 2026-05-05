# oregatari-be

漫画ストーリー制作支援アプリのバックエンド API。

## 参考ページ

- [公開作品サンプル](https://oregatari-fe.vercel.app/works/1)

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
MASTRA_JWT_TOKEN="..."  # Mastra Cloud の JWT トークン（未設定の場合は認証ヘッダーなし）
CORS_ORIGIN="http://localhost:5173"
```

`MASTRA_JWT_TOKEN` は BE → Mastra 間の内部認証に使うトークン。`MastraClient` がすべてのリクエストに `Authorization: Bearer <token>` ヘッダーとして付与します。未設定の場合は認証ヘッダーなしで送信されます。

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

## FE / BE / Mastra の連携

### システム全体像

```
┌─────────────────────────────────────────────────────────────┐
│  oregatari-fe (React)                                       │
│  localhost:5173                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST / SSE  (Authorization: Bearer JWT)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  oregatari-be (Hono / Vercel)                               │
│  localhost:3000                                             │
│  ・認証 (Supabase JWT 検証)                                  │
│  ・CRUD (Prisma → Supabase)                                 │
│  ・AI ジョブ管理 (MastraClient)                              │
└──────────┬────────────────────────────┬─────────────────────┘
           │ Prisma (DATABASE_URL)       │ HTTP (MASTRA_URL)
           ▼                            ▼
┌──────────────────────┐   ┌────────────────────────────────────┐
│  Supabase            │   │  oregatari-mastra (Mastra)         │
│  PostgreSQL          │◄──│  localhost:4111                    │
│  localhost:54322     │   │  ・Workflow エンジン                │
└──────────────────────┘   │  ・AI Agent (Gemini / GPT)         │
                           │  ・Prisma で DB に直接書き込み      │
                           └────────────────────────────────────┘
```

### フロー 1: 通常の CRUD

```mermaid
sequenceDiagram
    participant FE as FE (React)
    participant BE as BE (Hono)
    participant DB as Supabase (PostgreSQL)

    FE->>BE: REST API (Authorization: Bearer JWT)
    BE->>DB: JWT 検証 (Supabase Auth)
    DB-->>BE: ユーザー情報
    BE->>DB: Prisma クエリ (CRUD)
    DB-->>BE: 結果
    BE-->>FE: JSON レスポンス
```

### フロー 2: AI ストリーミング生成 (SSE)

ストーリー生成・キャラクター三面図・エピソード生成などで使用。
FE はリアルタイムにテキストを受け取りながら表示できます。

```mermaid
sequenceDiagram
    participant FE as FE (React)
    participant BE as BE (Hono)
    participant MA as Mastra
    participant AI as AI モデル
    participant DB as Supabase (PostgreSQL)

    FE->>BE: POST /stories/:id/generate (SSE 接続)
    BE->>MA: POST /api/workflows/story-generation-workflow/stream
    MA->>DB: ストーリー情報を取得 (Prisma)
    DB-->>MA: Story / Character データ
    MA->>AI: プロンプト送信
    AI-->>MA: テキストストリーム
    MA-->>BE: SSE イベント (workflow-step-output)
    BE-->>FE: SSE イベント転送 (data: {"text": "..."})
    MA->>DB: 生成結果を保存 (Prisma)
    MA-->>BE: ストリーム終了
    BE-->>FE: ストリーム終了
```

> 同様のパターン: `character-three-view-workflow` / `episode-generation-workflow` / `panel-layout-workflow` / `page-prompt-workflow`

### フロー 3: バックグラウンドジョブ (画像生成など)

画像生成・パネルレイアウト生成など時間のかかる処理で使用。
FE はジョブ ID を受け取り、SSE で進行状況を監視します。

```mermaid
sequenceDiagram
    participant FE as FE (React)
    participant BE as BE (Hono)
    participant MA as Mastra
    participant AI as AI モデル / 画像モデル
    participant DB as Supabase (PostgreSQL)

    FE->>BE: POST /episodes/:episodeId/pages/generate-image-job
    BE->>MA: POST /create-run  →  runId 取得
    BE->>MA: POST /start?runId=... (非同期実行開始)
    BE->>DB: Job レコード作成 (status=RUNNING)
    BE-->>FE: { jobId }

    FE->>BE: GET /jobs/:jobId/events (SSE 接続)
    BE->>MA: POST /observe?runId=... (進行監視)
    MA->>DB: エピソード・ページ情報を取得
    MA->>AI: 画像生成リクエスト
    AI-->>MA: 生成結果
    MA->>DB: 画像 URL を保存
    MA-->>BE: SSE イベント
    BE-->>FE: SSE イベント転送
    MA-->>BE: ストリーム終了
    BE->>MA: GET /runs/:runId (最終ステータス確認)
    MA-->>BE: { status: "success" }
    BE->>DB: Job を DONE に更新
    BE-->>FE: data: { status: "success" }
```

> 同様のパターン: `panel-layout-full-workflow` (パネルレイアウト) / `cover-image-workflow` (表紙画像)

### Mastra ワークフロー一覧

| ワークフロー ID | 用途 | 呼び出し方式 |
|---|---|---|
| `story-generation-workflow` | ストーリー構成生成 | SSE ストリーム |
| `character-three-view-workflow` | キャラクター三面図生成 | SSE ストリーム |
| `episode-generation-workflow` | エピソード本文生成 | SSE ストリーム |
| `panel-layout-workflow` | ページレイアウト生成（同期） | SSE ストリーム |
| `page-prompt-workflow` | ページ画像プロンプト生成 | SSE ストリーム |
| `panel-layout-full-workflow` | ページレイアウト生成（ジョブ） | バックグラウンドジョブ |
| `page-image-workflow` | ページ画像生成 | バックグラウンドジョブ |
| `cover-image-workflow` | 表紙画像生成 | バックグラウンドジョブ |

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
