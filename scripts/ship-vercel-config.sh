#!/usr/bin/env bash
set -euo pipefail

# One-shot setup: store VERCEL_TOKEN in GitHub and run Vercel Production Setup.
# Run this on your machine (not the cloud agent) with your GitHub CLI logged in.
#
# Usage:
#   ./scripts/ship-vercel-config.sh
# Or:
#   VERCEL_TOKEN=xxx ./scripts/ship-vercel-config.sh

REPO="${GITHUB_REPO:-maherelfarraj/gridmind-epc}"
WORKFLOW="Vercel Production Setup"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Create a token at https://vercel.com/account/tokens"
  echo "Name it: gridmind-epc-github-actions"
  read -rsp "Paste VERCEL_TOKEN: " VERCEL_TOKEN
  echo
fi

if [[ -z "$VERCEL_TOKEN" ]]; then
  echo "ERROR: VERCEL_TOKEN is required" >&2
  exit 1
fi

echo "==> Saving VERCEL_TOKEN to GitHub Actions secrets (${REPO})"
printf '%s' "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN -R "$REPO"

echo "==> Running configure script locally (immediate Vercel API setup)"
VERCEL_TOKEN="$VERCEL_TOKEN" "$(dirname "$0")/configure-vercel-project.sh"

echo "==> Triggering GitHub Actions workflow: ${WORKFLOW}"
gh workflow run "$WORKFLOW" -R "$REPO" --ref main

echo "==> Waiting for workflow to start..."
sleep 5
gh run list -R "$REPO" --workflow "$WORKFLOW" --limit 1

cat <<'EOF'

Next:
- Open Vercel -> pvmind -> Deployments and confirm production redeploy
- Update pvmind.ai DNS at GoDaddy:
    A     @    76.76.21.21
    CNAME www  cname.vercel-dns.com
EOF
