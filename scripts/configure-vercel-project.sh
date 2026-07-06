#!/usr/bin/env bash
set -euo pipefail

# Configure GridMind EPC on Vercel:
# - Root Directory -> web
# - Domains -> pvmind.ai, www.pvmind.ai
# - Optional project rename -> gridmindepc (skipped if name is taken)
#
# Usage:
#   VERCEL_TOKEN=xxx ./scripts/configure-vercel-project.sh

API="https://api.vercel.com"
PROJECT="${VERCEL_PROJECT:-gridmindepc}"
ROOT_DIRECTORY="${VERCEL_ROOT_DIRECTORY:-web}"
RENAME_PROJECT="${RENAME_PROJECT:-gridmindepc}"
IFS=',' read -r -a DOMAINS <<< "${VERCEL_DOMAINS:-pvmind.ai,www.pvmind.ai}"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ERROR: Set VERCEL_TOKEN (https://vercel.com/account/tokens)" >&2
  exit 1
fi

team_query() {
  if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
    echo "?teamId=${VERCEL_TEAM_ID}"
  fi
}

api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local url="${API}${path}$(team_query)"

  if [[ -n "$body" ]]; then
    curl -sS -X "$method" "$url" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -sS -X "$method" "$url" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}"
  fi
}

print_project() {
  python3 - <<'PY'
import json, sys
p = json.load(sys.stdin)
print("  rootDirectory:", p.get("rootDirectory"))
print("  name:", p.get("name"))
PY
}

print_domain() {
  python3 - <<'PY'
import json, sys
d = json.load(sys.stdin)
print("  verified:", d.get("verified"))
for v in d.get("verification") or []:
    print(f"  DNS {v.get('type')} {v.get('domain')} -> {v.get('value')}")
PY
}

echo "==> Configuring Vercel project: ${PROJECT}"

echo "==> Setting Root Directory to '${ROOT_DIRECTORY}'"
root_response="$(api PATCH "/v9/projects/${PROJECT}" "{\"rootDirectory\":\"${ROOT_DIRECTORY}\"}")"
if echo "$root_response" | python3 -c 'import json,sys; json.load(sys.stdin)' 2>/dev/null; then
  echo "$root_response" | print_project
else
  echo "ERROR: could not update project '${PROJECT}': ${root_response}" >&2
  exit 1
fi

if [[ -n "$RENAME_PROJECT" && "$RENAME_PROJECT" != "$PROJECT" ]]; then
  echo "==> Renaming project to '${RENAME_PROJECT}'"
  rename_response="$(api PATCH "/v9/projects/${PROJECT}" "{\"name\":\"${RENAME_PROJECT}\"}")"
  if echo "$rename_response" | python3 -c 'import json,sys; json.load(sys.stdin)' 2>/dev/null; then
    echo "$rename_response" | print_project
    PROJECT="$RENAME_PROJECT"
  else
    echo "  note: rename skipped (${rename_response}). Another project may already use '${RENAME_PROJECT}'."
    echo "  Delete the empty gridmindepc project in Vercel dashboard to fix gridmindepc.vercel.app."
  fi
fi

for domain in "${DOMAINS[@]}"; do
  domain="$(echo "$domain" | xargs)"
  [[ -z "$domain" ]] && continue
  echo "==> Adding domain: ${domain}"
  domain_response="$(api POST "/v10/projects/${PROJECT}/domains" "{\"name\":\"${domain}\"}")"
  if echo "$domain_response" | python3 -c 'import json,sys; json.load(sys.stdin)' 2>/dev/null; then
    echo "$domain_response" | print_domain
  else
    echo "  note: ${domain} may already exist on this project (${domain_response})"
  fi
done

echo "==> Root Directory and domains apply on the next production deployment."

cat <<EOF

Done.

Verify:
  https://${PROJECT}.vercel.app
  https://pvmind.ai (after DNS cutover)

Point pvmind.ai DNS at your registrar to Vercel:
  A     @    76.76.21.21
  CNAME www  cname.vercel-dns.com

Current pvmind.ai is on GoDaddy Website Builder (DPS). Update DNS to switch to Vercel.
EOF
