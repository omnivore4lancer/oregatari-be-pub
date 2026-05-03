# CLAUDE.md

[アーキテクチャ詳細](ARCHITECTURE.md)

## プロジェクト概要

Hono + Vercel + Supabase (PostgreSQL) + Prisma 7 で構成された REST API。

## ローカル開発

```sh
# Supabase 起動（モノレポルートから実行）
cd .. && supabase start && cd oregatari-be

# マイグレーション実行
npx prisma migrate dev

# 開発サーバー起動
vercel dev
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
```

## アーキテクチャ方針

各層の責務を明確に分離する。

- **Route** (`src/routes/`): 外部入力をバリデーション。`schema.safeParse()` を呼ぶのはここだけ。バリデーションエラーは `safeParse` でインライン 400 応答として返す（Hono の `app.route()` はサブアプリのエラーハンドラを伝播しないため、ミドルウェア方式ではなく `safeParse` を使う）。パスパラメータは `numericId.parse()` を使い、エラーは `index.ts` の `onError` でキャッチされる。
- **Usecase** (`src/usecases/`): 型が保証された入力でビジネスロジックを実行。`unknown` は受け取らない。
- **Repository** (`src/repositories/`): 型付き引数を受け取り、DB 操作のみに集中。`parse()` は呼ばない。
- **MastraClient** (`src/lib/mastraClient.ts`): Mastra との HTTP 通信はすべて `MastraClient` 経由で行う。ルートから直接 `fetch` で Mastra API を呼ばない。

Zod スキーマと `*Input` 型は repository ファイルで定義し、route からインポートして使う。

`*Input` 型は `z.infer<typeof schema>` で定義するため **Zod の出力型**（デフォルト値適用済み）であり、HTTP リクエストボディの形状とは異なる場合がある。例えば `CreateCharacterInput` には `isProtagonist: boolean` と `skills: string[]` が必須で含まれるが、リクエスト時は省略可能（Zod がデフォルト値を補完する）。

## ディレクトリ構成

```
vercel/
├── prisma/
│   ├── schema/               # マルチファイルスキーマ
│   │   ├── base.prisma       # generator & datasource
│   │   ├── user.prisma       # User モデル
│   │   └── post.prisma       # Post モデル
│   └── migrations/
├── src/
│   ├── index.ts              # ルーティング・エラーハンドリング
│   ├── routes/               # バリデーション（Zod parse）・HTTP レスポンス
│   ├── usecases/             # ビジネスロジック
│   ├── repositories/         # DB アクセス・Zod スキーマ定義
│   └── lib/
│       └── container.ts      # DI（usecase インスタンス管理）
├── prisma.config.ts
└── .env
```

## 環境変数 (.env)

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_PUBLISHABLE_KEY="..."
SUPABASE_SECRET_KEY="..."
```
