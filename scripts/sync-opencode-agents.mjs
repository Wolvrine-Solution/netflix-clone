#!/usr/bin/env node
/**
 * Generate OpenCode subagents from the Claude Code ones, so `.claude/agents/` stays the single
 * source of truth for all three tools (Cursor reads `.claude/agents/` natively).
 *
 *   node scripts/sync-opencode-agents.mjs          # write .opencode/agents/*.md
 *   node scripts/sync-opencode-agents.mjs --check  # exit 1 if the generated copies drifted
 *
 * Mapping: `tools: Read, Grep, Glob, Bash` → OpenCode boolean tool map (write/edit/bash on or off);
 * `mode: subagent` added. `model` is dropped — OpenCode model ids are provider-specific
 * (`provider/model`), so the subagent inherits the session model unless configured globally.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, '.claude', 'agents');
const OUT = join(ROOT, '.opencode', 'agents');
const CHECK = process.argv.includes('--check');

function convert(text, file) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const fm = Object.fromEntries(
    m[1]
      .split('\n')
      .map((l) => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()]),
  );
  const tools = (fm.tools ?? '').split(',').map((t) => t.trim().toLowerCase());
  const can = (t) => tools.includes(t);
  const body = m[2].replace(/<!-- managed by agent-repo-kit[^>]*-->\n*/, '');
  return [
    '---',
    `description: ${JSON.stringify(fm.description)}`,
    'mode: subagent',
    'tools:',
    `  write: ${can('write')}`,
    `  edit: ${can('edit')}`,
    `  bash: ${can('bash')}`,
    '---',
    '',
    `<!-- GENERATED from .claude/agents/${file} by scripts/sync-opencode-agents.mjs — edit the source, then re-run. -->`,
    '',
    body.trimStart(),
  ].join('\n');
}

const drift = [];
mkdirSync(OUT, { recursive: true });
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.md'))) {
  const want = convert(readFileSync(join(SRC, file), 'utf8'), file);
  const dest = join(OUT, file);
  const have = existsSync(dest) ? readFileSync(dest, 'utf8') : null;
  if (have === want) continue;
  if (CHECK) drift.push(file);
  else writeFileSync(dest, want);
}
if (CHECK && drift.length) {
  console.error(`OpenCode agents out of sync: ${drift.join(', ')} — run node scripts/sync-opencode-agents.mjs`);
  process.exit(1);
}
console.log(CHECK ? 'OpenCode agents in sync' : `OpenCode agents written to .opencode/agents/`);
