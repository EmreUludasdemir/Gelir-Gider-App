#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔎 API lint+test"
cd "$ROOT/apps/api" && npm run lint && npm test

echo "🔎 Web lint"
cd "$ROOT/apps/web" && npm run lint

[[ "${VERIFY_NO_BUILD:-0}" != "1" ]] && {
  echo "🏗️ Building API"
  cd "$ROOT/apps/api" && npm run build
  echo "🏗️ Building Web"
  cd "$ROOT/apps/web" && npm run build
}

echo "✅ verify OK"
