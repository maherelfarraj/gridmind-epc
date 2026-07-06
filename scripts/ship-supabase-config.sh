#!/usr/bin/env bash
set -euo pipefail

# Store Supabase secrets in GitHub Actions and sync to Vercel.
# Run on your machine with gh CLI logged in as repo owner.
#
# Usage:
#   ./scripts/ship-supabase-config.sh
#
# Or pass values directly:
#   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
#   SUPABASE_SERVICE_ROLE_KEY=... VERCEL_TOKEN=... ./scripts/ship-supabase-config.sh

REPO="${GITHUB_REPO:-maherelfarraj/gridmind-epc}"
WORKFLOW="Vercel Production Setup"

prompt_secret() {
  local name="$1"
  local hint="$2"
  local value="${!name:-}"
  if [[ -z "$value" ]]; then
    echo "$hint"
    read -rsp "Paste ${name}: " value
    echo
  fi
  printf '%s' "$value"
}

echo "==> Supabase credentials (Project Settings -> API in supabase.com)"
SUPABASE_URL="$(prompt_secret NEXT_PUBLIC_SUPABASE_URL "https://xxxx.supabase.co")"
SUPABASE_ANON="$(prompt_secret NEXT_PUBLIC_SUPABASE_ANON_KEY "anon public key")"
SUPABASE_SERVICE="$(prompt_secret SUPABASE_SERVICE_ROLE_KEY "service_role key (keep secret)")"

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_ANON" || -z "$SUPABASE_SERVICE" ]]; then
  echo "ERROR: all three Supabase values are required" >&2
  exit 1
fi

echo "==> Saving GitHub Actions secrets (${REPO})"
printf '%s' "$SUPABASE_URL" | gh secret set NEXT_PUBLIC_SUPABASE_URL -R "$REPO"
printf '%s' "$SUPABASE_ANON" | gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY -R "$REPO"
printf '%s' "$SUPABASE_SERVICE" | gh secret set SUPABASE_SERVICE_ROLE_KEY -R "$REPO"

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  echo "==> Syncing to Vercel immediately"
  NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE" \
  NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://pvmind.ai}" \
  VERCEL_TOKEN="$VERCEL_TOKEN" \
    "$(dirname "$0")/configure-vercel-env.sh"
else
  echo "==> Skipping direct Vercel sync (set VERCEL_TOKEN to sync immediately)"
fi

echo "==> Triggering workflow: ${WORKFLOW}"
gh workflow run "$WORKFLOW" -R "$REPO" --ref main

sleep 5
gh run list -R "$REPO" --workflow "$WORKFLOW" --limit 1

cat <<'EOF'

Verify after deploy (~2 min):
  curl -s -X POST https://gridmindepc.vercel.app/api/calculate \
    -H 'Content-Type: application/json' \
    -d '{"capacityMw":50,"moduleWatt":650,"inverterKw":3500}' | jq .

Expect no "Supabase env not configured" warning when secrets are live.
EOF
