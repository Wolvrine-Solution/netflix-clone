#!/usr/bin/env bash
# kit-upstream check — run before adding an entry to the kit's generic pitfalls register.
#   bash check.sh KIT_DIR                  # numbers on origin/main + open PRs, collisions, next free
#   bash check.sh KIT_DIR CANDIDATE_FILE   # also dup-check the candidate entry against all of them
# exit 0: next free number printed, no collision, no near-duplicate
# exit 1: a number is claimed twice, or the candidate is a near-duplicate
# exit 2: open PRs could not be listed — a number is never called free unchecked
# KIT_UPSTREAM_REFS="label=ref …" replaces the gh listing (tests); KIT_UPSTREAM_GH overrides gh.
set -euo pipefail
KIT="${1:?usage: check.sh KIT_DIR [CANDIDATE_FILE]}"
CAND="${2:-}"
REG="template/docs/PITFALLS.md"
GH="${KIT_UPSTREAM_GH:-gh}"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
cd "${KIT}"
git fetch -q origin
git show "origin/main:${REG}" >"${TMP}/main.md"
nums() { sed -nE 's/^### ([0-9]+[a-z]?) .*/\1/p' "$1" | sort -u; }

if [[ -n "${KIT_UPSTREAM_REFS:-}" ]]; then
	refs="${KIT_UPSTREAM_REFS}"
elif ! refs="$("${GH}" pr list --state open --json number,headRefName \
	-q '.[]|"PR#\(.number)=\(.headRefName)"' 2>/dev/null)"; then
	echo "open PRs could not be listed (${GH} missing or not logged in) — no number is free" >&2
	exit 2
fi

rc=0
echo "main: $(nums "${TMP}/main.md" | wc -l) entries"
: >"${TMP}/claims"
for pair in ${refs}; do
	label="${pair%%=*}" ref="${pair#*=}"
	git fetch -q origin "${ref}" 2>/dev/null || { echo "skip ${label}: ${ref} not on origin"; continue; }
	git show "FETCH_HEAD:${REG}" >"${TMP}/pr-${label//[^A-Za-z0-9]/_}.md" 2>/dev/null || continue
	new="$(comm -13 <(nums "${TMP}/main.md") <(nums "${TMP}/pr-${label//[^A-Za-z0-9]/_}.md") | tr '\n' ' ')"
	[[ -n "${new// /}" ]] && echo "${label} (${ref}) adds: ${new}"
	for n in ${new}; do echo "${n} ${label}" >>"${TMP}/claims"; done
	twice="$(sed -nE 's/^### ([0-9]+[a-z]?) .*/\1/p' "${TMP}/pr-${label//[^A-Za-z0-9]/_}.md" | sort | uniq -d | tr '\n' ' ')"
	[[ -z "${twice// /}" ]] || { echo "COLLISION ${twice}: twice in ${label}'s register"; rc=1; }
done

while read -r n; do
	echo "COLLISION ${n}: claimed by $(awk -v n="${n}" '$1==n{printf "%s ", $2}' "${TMP}/claims")"
	rc=1
done < <(cut -d' ' -f1 "${TMP}/claims" | sort | uniq -d)
reused="$(comm -12 <(nums "${TMP}/main.md") <(cut -d' ' -f1 "${TMP}/claims" | sort -u) | tr '\n' ' ')"
[[ -z "${reused// /}" ]] || { echo "COLLISION ${reused}: already on main"; rc=1; }

max="$({ nums "${TMP}/main.md"; cut -d' ' -f1 "${TMP}/claims"; } | sed 's/[a-z]$//' | sort -n | tail -1)"
echo "next free: $((max + 1))"

if [[ -n "${CAND}" ]]; then
	shopt -s nullglob
	python3 scripts/dup-check.py "${TMP}/main.md" "${TMP}"/pr-*.md --candidate "$(cat "${CAND}")" || rc=1
fi
exit "${rc}"
