#!/bin/bash
# Run every mobile (react-native-web / expo-router static export) feature
# spec individually and collect a clean, named video per feature, at a
# phone-sized viewport.
#
# Usage:
#   ./record-feature-videos.sh            # headless, fast
#   ./record-feature-videos.sh headed     # watch it run live (needs DISPLAY)

set -e

MODE=${1:-headless}
ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
OUT_DIR="$ROOT_DIR/videos"
SPEC_DIR="$ROOT_DIR/e2e/features"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cd "$ROOT_DIR"

echo "📦 Building web export..."
npm run build:web

echo "🌐 Serving on :8400..."
pkill -f "http-server.*8400" 2>/dev/null || true
sleep 1
nohup npx --yes http-server dist -p 8400 -e html > /tmp/netflix-mobile-serve.log 2>&1 &
SERVER_PID=$!
sleep 2

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "🎬 Recording feature videos ($MODE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for spec in "$SPEC_DIR"/*.spec.ts; do
  name=$(basename "$spec" .spec.ts)
  echo ""
  echo "▶️  $name"

  rm -rf test-results
  if [ "$MODE" = "headed" ]; then
    DISPLAY=${DISPLAY:-:1} BASE_URL=http://localhost:8400 npx playwright test "$spec" --headed || true
  else
    BASE_URL=http://localhost:8400 npx playwright test "$spec" || true
  fi

  while IFS= read -r -d '' video; do
    testdir=$(basename "$(dirname "$video")")
    cp "$video" "$OUT_DIR/${name}__${testdir}.webm"
  done < <(find test-results -name "*.webm" -print0 2>/dev/null)
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Done. Videos saved to: $OUT_DIR"
ls -lh "$OUT_DIR" 2>/dev/null
