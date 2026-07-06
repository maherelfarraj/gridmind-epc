#!/usr/bin/env bash
set -euo pipefail

# Configure GridMind EPC on Vercel:
# - Root Directory -> web
# - Domains -> pvmind.ai, www.pvmind.ai
# - Optional project rename -> gridmindepc (fixes gridmindepc.vercel.app)
#
# Usage:
#   VERCEL_TOKEN=xxx ./scripts/configure-vercel-project.sh

API="https://api.vercel.com"
PROJECT="${VERCEL_PROJECT:-gridmind-epc}"
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
    curl -fsS -X "$method" "$url" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -fsS -X "$method" "$url" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}"
  fi
}

print_project() {
  python3 -c 'import json,sys; p=json.load(sys.stdin); print("  rootDirectory:", p.get("rootDirectory")); print("  name:", p.get("name"))'
}

print_domain() {
  python3 -c 'import json,sys; d=json.load(sys.stdin); print("  verified:", d.get("verified"));
v=d.get("verification") or []
[print(f"  DNS {x.get(\"type\")} {x.get(\"domain\")} -> {x.get(\"value\")}") for x in v]'
}

echo "==> Configuring Vercel project: ${PROJECT}"

echo "==> Setting Root Directory to '${ROOT_DIRECTORY}'"
api PATCH "/v9/projects/${PROJECT}" "{\"rootDirectory\":\"${ROOT_DIRECTORY}\"}" | print_project

if [[ -n "$RENAME_PROJECT" && "$RENAME_PROJECT" != "$PROJECT" ]]; then
  echo "==> Renaming project to '${RENAME_PROJECT}'"
  api PATCH "/v9/projects/${PROJECT}" "{\"name\":\"${RENAME_PROJECT}\"}" | print_project
  PROJECT="$RENAME_PROJECT"
fi

for domain in "${DOMAINS[@]}"; do
  domain="$(echo "$domain" | xargs)"
  [[ -z "$domain" ]] && continue
  echo "==> Adding domain: ${domain}"
  if response="$(api POST "/v10/projects/${PROJECT}/domains" "{\"name\":\"${domain}\"}" 2>&1)"; then
    echo "$response" | print_domain
  else
    echo "  note: ${domain} may already exist on this project"
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
