#!/usr/bin/env bash
set -euo pipefail

# Push environment variables to the Vercel gridmindepc project.
# Reads from env vars (typically GitHub Actions secrets).
#
# Required for Supabase save (optional for cockpit UI):
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   NEXT_PUBLIC_APP_URL (defaults to https://pvmind.ai)

API="https://api.vercel.com"
TARGETS='["production","preview","development"]'

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ERROR: VERCEL_TOKEN required" >&2
  exit 1
fi

team_query() {
  if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
    echo "?teamId=${VERCEL_TEAM_ID}&upsert=true"
  else
    echo "?upsert=true"
  fi
}

resolve_project() {
  for candidate in "${VERCEL_PROJECT:-}" gridmindepc gridmind-epc; do
    [[ -z "$candidate" ]] && continue
    status="$(curl -sS -o /dev/null -w '%{http_code}' \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      "${API}/v9/projects/${candidate}$(team_query | sed 's/&upsert=true//')")"
    if [[ "$status" == "200" ]]; then
      PROJECT="$candidate"
      echo "==> Vercel project: ${PROJECT}"
      return 0
    fi
  done
  echo "ERROR: project not found" >&2
  exit 1
}

set_env() {
  local key="$1"
  local value="$2"
  local type="${3:-encrypted}"
  [[ -z "$value" ]] && return 0

  local payload
  payload="$(python3 -c 'import json,sys; print(json.dumps([{"key":sys.argv[1],"value":sys.argv[2],"type":sys.argv[3],"target":["production","preview","development"]}]))' "$key" "$value" "$type")"

  local raw
  raw="$(curl -sS -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "${API}/v10/projects/${PROJECT}/env$(team_query)")"
  local body="${raw%$'\n'*}"
  local status="${raw##*$'\n'}"

  if [[ "$status" == "200" || "$status" == "201" ]]; then
    echo "  set ${key}"
  else
    echo "  note: ${key} returned ${status}: ${body}"
  fi
}

resolve_project

APP_URL="${NEXT_PUBLIC_APP_URL:-https://pvmind.ai}"

echo "==> Syncing environment variables"
set_env "NEXT_PUBLIC_APP_URL" "$APP_URL" "plain"
set_env "NEXT_PUBLIC_SUPABASE_URL" "${NEXT_PUBLIC_SUPABASE_URL:-}" "encrypted"
set_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" "encrypted"
set_env "SUPABASE_SERVICE_ROLE_KEY" "${SUPABASE_SERVICE_ROLE_KEY:-}" "encrypted"

if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo
  echo "NOTE: Supabase secrets not provided. Cockpit works via localStorage;"
  echo "      /api/calculate will return results without DB save until secrets are added."
  echo "      Add GitHub secrets: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,"
  echo "      SUPABASE_SERVICE_ROLE_KEY — then re-run this workflow."
else
  echo
  echo "==> Triggering production redeploy (env vars require redeploy)"
  deploy_raw="$(curl -sS -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${PROJECT}\",\"target\":\"production\",\"gitSource\":{\"type\":\"github\",\"org\":\"maherelfarraj\",\"repo\":\"gridmind-epc\",\"ref\":\"main\"}}" \
    "${API}/v13/deployments$(team_query | sed 's/&upsert=true//')")"
  deploy_status="${deploy_raw##*$'\n'}"
  if [[ "$deploy_status" == "200" ]]; then
    echo "  redeploy triggered"
  else
    echo "  redeploy note: ${deploy_status}"
  fi
fi

echo "Done."
