#!/bin/bash
# Run every feature spec individually and collect a clean, named video per feature.
# No manual screen recording — Playwright records video for every test automatically.
#
# Usage:
#   ./record-feature-videos.sh            # headless, fast
#   ./record-feature-videos.sh headed     # watch it run live (needs DISPLAY)
#
# Output: videos/<feature-file-name>.webm (one or more per spec, named by test)

set -e

MODE=${1:-headless}
ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
OUT_DIR="$ROOT_DIR/videos"
SPEC_DIR="$ROOT_DIR/e2e/features"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cd "$ROOT_DIR"

echo "🎬 Recording feature videos ($MODE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for spec in "$SPEC_DIR"/*.spec.ts; do
  name=$(basename "$spec" .spec.ts)
  echo ""
  echo "▶️  $name"

  rm -rf test-results
  if [ "$MODE" = "headed" ]; then
    DISPLAY=${DISPLAY:-:1} npx playwright test "$spec" --headed || true
  else
    npx playwright test "$spec" || true
  fi

  # Copy + rename every video produced for this spec
  while IFS= read -r -d '' video; do
    testdir=$(basename "$(dirname "$video")")
    cp "$video" "$OUT_DIR/${name}__${testdir}.webm"
  done < <(find test-results -name "*.webm" -print0 2>/dev/null)
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Done. Videos saved to: $OUT_DIR"
ls -lh "$OUT_DIR" 2>/dev/null
