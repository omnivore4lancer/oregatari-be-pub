#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.production"
TARGET="${1:-production}"   # production | preview | development

while IFS='=' read -r key value || [ -n "$key" ]; do
  # 空行・コメント行をスキップ
  [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
  # 前後のクォートを除去
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"
  # 既存があれば削除してから追加（上書き挙動）
  vercel env rm "$key" "$TARGET" --yes 2>/dev/null || true
  printf '%s' "$value" | vercel env add "$key" "$TARGET"
  echo "✓ $key"
done < "$ENV_FILE"