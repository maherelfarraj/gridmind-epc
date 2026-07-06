#!/usr/bin/env bash
set -euo pipefail

# Configure the GridMind EPC Vercel project:
# - Root Directory -> web
# - Domains -> gridmindepc.com, www.gridmindepc.com
# - Optional production redeploy
#
# Usage:
#   VERCEL_TOKEN=xxx ./scripts/configure-vercel-project.sh
# Optional env vars:
#   VERCEL_PROJECT=gridmind-epc
#   VERCEL_TEAM_ID=team_xxx
#   RENAME_PROJECT=gridmindepc   # rename project so gridmindepc.vercel.app works

API="https://api.vercel.com"
PROJECT="${VERCEL_PROJECT:-gridmind-epc}"
ROOT_DIRECTORY="${VERCEL_ROOT_DIRECTORY:-web}"
DOMAINS=("gridmindepc.com" "www.gridmindepc.com")

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ERROR: Set VERCEL_TOKEN (create one at https://vercel.com/account/tokens)" >&2
  exit 1
fi

auth_header() {
  echo "Authorization: Bearer ${VERCEL_TOKEN}"
}

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
      -H "$(auth_header)" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -fsS -X "$method" "$url" \
      -H "$(auth_header)"
  fi
}

echo "==> Configuring Vercel project: ${PROJECT}"

echo "==> Setting Root Directory to '${ROOT_DIRECTORY}'"
api PATCH "/v9/projects/${PROJECT}" "{\"rootDirectory\":\"${ROOT_DIRECTORY}\"}" | python3 -c "
import json,sys
p=json.load(sys.stdin)
print('  rootDirectory:', p.get('rootDirectory'))
print('  name:', p.get('name'))
"

if [[ -n "${RENAME_PROJECT:-}" ]]; then
  echo "==> Renaming project to '${RENAME_PROJECT}' (enables ${RENAME_PROJECT}.vercel.app)"
  api PATCH "/v9/projects/${PROJECT}" "{\"name\":\"${RENAME_PROJECT}\"}" | python3 -c "
import json,sys
p=json.load(sys.stdin)
print('  name:', p.get('name'))
"
  PROJECT="${RENAME_PROJECT}"
fi

for domain in "${DOMAINS[@]}"; do
  echo "==> Adding domain: ${domain}"
  if api POST "/v10/projects/${PROJECT}/domains" "{\"name\":\"${domain}\"}" 2>/dev/null; then
    echo "  added ${domain}"
  else
    echo "  ${domain} may already exist or needs DNS verification in Vercel dashboard"
  fi
done

echo "==> Root Directory applies on the next deployment."
echo "    Push to main or click Redeploy in the Vercel dashboard."

echo ""
echo "Done. Verify:"
echo "  https://${PROJECT}.vercel.app"
echo "  https://gridmindepc.com (after DNS is pointed to Vercel)"
echo ""
echo "DNS for gridmindepc.com (set at your registrar):"
echo "  A     @    76.76.21.21"
echo "  CNAME www  cname.vercel-dns.com"
