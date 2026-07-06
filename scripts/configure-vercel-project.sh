#!/usr/bin/env bash
set -euo pipefail

# Configure GridMind EPC on Vercel:
# - Root Directory -> web
# - Domains -> pvmind.ai, www.pvmind.ai
#
# Usage:
#   VERCEL_TOKEN=xxx ./scripts/configure-vercel-project.sh

API="https://api.vercel.com"
ROOT_DIRECTORY="${VERCEL_ROOT_DIRECTORY:-web}"
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
    curl -sS -w "\n%{http_code}" -X "$method" "$url" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -sS -w "\n%{http_code}" -X "$method" "$url" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}"
  fi
}

parse_api_response() {
  local raw="$1"
  local body="${raw%$'\n'*}"
  local status="${raw##*$'\n'}"
  printf '%s\n' "$body"
  return "$(( status >= 400 ? 1 : 0 ))"
}

print_project_json() {
  python3 -c 'import json,sys; p=json.loads(sys.argv[1]); print("  rootDirectory:", p.get("rootDirectory")); print("  name:", p.get("name"))' "$1"
}

print_domain_json() {
  python3 -c 'import json,sys; d=json.loads(sys.argv[1]); print("  verified:", d.get("verified"));
for v in d.get("verification") or []:
    print("  DNS", v.get("type"), v.get("domain"), "->", v.get("value"))' "$1"
}

resolve_project() {
  local candidate
  for candidate in "${VERCEL_PROJECT:-}" gridmindepc gridmind-epc; do
    [[ -z "$candidate" ]] && continue
    local raw
    raw="$(api GET "/v9/projects/${candidate}")" || true
    local body="${raw%$'\n'*}"
    local status="${raw##*$'\n'}"
    if [[ "$status" == "200" ]]; then
      PROJECT="$candidate"
      echo "==> Using Vercel project: ${PROJECT}"
      return 0
    fi
  done
  echo "ERROR: Could not find Vercel project (tried gridmindepc, gridmind-epc)" >&2
  exit 1
}

resolve_project

echo "==> Setting Root Directory to '${ROOT_DIRECTORY}'"
raw="$(api PATCH "/v9/projects/${PROJECT}" "{\"rootDirectory\":\"${ROOT_DIRECTORY}\"}")"
body="${raw%$'\n'*}"
status="${raw##*$'\n'}"
if [[ "$status" != "200" ]]; then
  echo "ERROR: PATCH rootDirectory failed (${status}): ${body}" >&2
  exit 1
fi
print_project_json "$body"

for domain in "${DOMAINS[@]}"; do
  domain="$(echo "$domain" | xargs)"
  [[ -z "$domain" ]] && continue
  echo "==> Adding domain: ${domain}"
  raw="$(api POST "/v10/projects/${PROJECT}/domains" "{\"name\":\"${domain}\"}")"
  body="${raw%$'\n'*}"
  status="${raw##*$'\n'}"
  if [[ "$status" == "200" || "$status" == "201" ]]; then
    print_domain_json "$body"
  else
    echo "  note: ${domain} returned ${status}: ${body}"
  fi
done

echo "==> Configuration complete."

echo "==> Triggering production redeploy"
deploy_raw="$(api POST "/v13/deployments" "{\"name\":\"${PROJECT}\",\"target\":\"production\",\"gitSource\":{\"type\":\"github\",\"org\":\"maherelfarraj\",\"repo\":\"gridmind-epc\",\"ref\":\"main\"}}")"
deploy_body="${deploy_raw%$'\n'*}"
deploy_status="${deploy_raw##*$'\n'}"
if [[ "$deploy_status" == "200" ]]; then
  python3 -c 'import json,sys; d=json.loads(sys.argv[1]); print("  deployment:", d.get("url") or d.get("id"))' "$deploy_body"
else
  echo "  note: redeploy returned ${deploy_status}: ${deploy_body}"
  echo "  Vercel may auto-deploy from GitHub on the next push."
fi

cat <<EOF

Verify:
  https://${PROJECT}.vercel.app
  https://pvmind.ai (after DNS cutover)

Point pvmind.ai DNS at your registrar to Vercel:
  A     @    76.76.21.21
  CNAME www  cname.vercel-dns.com
EOF
