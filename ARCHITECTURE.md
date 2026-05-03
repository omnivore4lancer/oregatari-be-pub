# Architecture

[Claude Code 開発ガイド](CLAUDE.md)

## 技術スタック

| 役割 | 技術 |
|---|---|
| フレームワーク | Hono |
| デプロイ | Vercel |
| ORM | Prisma 7 |
| DB | Supabase (PostgreSQL) |
| バリデーション | Zod v4 |

## ディレクトリ構成

```
vercel/
├── prisma/
│   ├── schema/               # マルチファイルスキーマ
│   │   ├── base.prisma       # generator & datasource
│   │   ├── user.prisma       # User モデル
│   │   └── post.prisma       # Post モデル
│   └── migrations/           # マイグレーションファイル
├── src/
│   ├── index.ts              # ルーティング（HTTPレイヤー）
│   ├── usecases/
│   │   └── userUsecase.ts    # ビジネスロジック
│   ├── repositories/
│   │   └── userRepository.ts # DB アクセス・バリデーション
│   └── generated/prisma/     # Prisma が自動生成するクライアント
├── prisma.config.ts          # Prisma 設定
└── .env                      # 環境変数
```

## レイヤー構成

```
HTTP リクエスト
     ↓
src/index.ts        ← ルーティング・レスポンス整形
     ↓
UserUsecase         ← ビジネスロジック・エラー定義
     ↓
UserRepository      ← Zod バリデーション・Prisma 呼び出し
     ↓
Supabase (PostgreSQL)
```

## 各レイヤーの責務

### index.ts（ルーティング）
- HTTP メソッドとパスのマッピング
- リクエストパラメータの取り出し
- UseCase のエラーを HTTP ステータスコードに変換

### UserUsecase（ビジネスロジック）
- ユースケース単位の処理フローを定義
- `UserNotFoundError` など、ドメイン固有のエラーを throw

### UserRepository（DBアクセス）
- Zod スキーマによる入力バリデーション
- Prisma を通じた CRUD 操作

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/users` | ユーザー一覧取得 |
| GET | `/users/:id` | ユーザー1件取得 |
| POST | `/users` | ユーザー作成 |
| PUT | `/users/:id` | ユーザー更新 |
| DELETE | `/users/:id` | ユーザー削除 |

### POST /users リクエストボディ

```json
{
  "email": "user@example.com",
  "name": "Alice"
}
```

### PUT /users/:id リクエストボディ

```json
{
  "email": "new@example.com",
  "name": "Alice Updated"
}
```

## 環境変数

| 変数名 | 説明 |
|---|---|
| `DATABASE_URL` | PostgreSQL 接続文字列 |
| `SUPABASE_URL` | Supabase API URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase 公開キー |
| `SUPABASE_SECRET_KEY` | Supabase シークレットキー |

## ローカル開発

```sh
# Supabase 起動
~/bin/supabase start

# マイグレーション実行
npx prisma migrate dev

# 開発サーバー起動
vercel dev
```
