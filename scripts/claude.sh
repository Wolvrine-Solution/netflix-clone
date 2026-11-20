#!/usr/bin/env bash
# managed by agent-repo-kit — local edits are overwritten by `bun run kit:sync`.
# Start Claude Code for this project with ONLY this project's MCP servers.
# --strict-mcp-config ignores ~/.claude.json (every globally registered server, ~300 tool names)
# and uses .mcp.json. Sources .env if present. Usage: bun run claude [args]
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$ROOT/.env" ]; then set -a; . "$ROOT/.env"; set +a; fi
exec claude --strict-mcp-config --mcp-config "$ROOT/.mcp.json" "$@"
