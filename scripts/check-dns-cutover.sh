#!/usr/bin/env bash
set -euo pipefail

# Check whether pvmind.ai DNS points to Vercel (post-cutover verification).
# Target: A @ -> 76.76.21.21, CNAME www -> cname.vercel-dns.com

DOMAIN="${1:-pvmind.ai}"
VERCEL_A="76.76.21.21"
VERCEL_WWW="cname.vercel-dns.com"

echo "==> DNS check for ${DOMAIN}"
echo

a_records="$(dig +short "${DOMAIN}" A | sort -u || true)"
www_cname="$(dig +short "www.${DOMAIN}" CNAME | sed 's/\.$//' || true)"
www_a="$(dig +short "www.${DOMAIN}" A | sort -u || true)"

echo "A records (@):"
if [[ -n "$a_records" ]]; then
  echo "$a_records" | sed 's/^/  /'
else
  echo "  (none)"
fi

echo
echo "www CNAME:"
if [[ -n "$www_cname" ]]; then
  echo "  ${www_cname}"
else
  echo "  (none)"
fi

echo
echo "Expected for Vercel cutover:"
echo "  A     @    ${VERCEL_A}"
echo "  CNAME www  ${VERCEL_WWW}"

ok=true
if ! echo "$a_records" | grep -qx "${VERCEL_A}"; then
  echo
  echo "FAIL: apex A record is not ${VERCEL_A}"
  ok=false
fi

if [[ "$www_cname" != "${VERCEL_WWW}" && "$www_cname" != "${DOMAIN}." ]]; then
  echo "WARN: www is not CNAME ${VERCEL_WWW} (current: ${www_cname:-A ${www_a}})"
fi

echo
echo "==> HTTP check"
curl -sI --max-time 10 "https://${DOMAIN}" | head -6 | sed 's/^/  /' || true

echo
if [[ "$ok" == "true" ]]; then
  server="$(curl -sI --max-time 10 "https://${DOMAIN}" | rg -i '^server:' | head -1 || true)"
  if echo "$server" | rg -qi 'vercel'; then
    echo "PASS: ${DOMAIN} appears to be served by Vercel."
    exit 0
  fi
  echo "PARTIAL: DNS A record is correct; HTTP may still be propagating or cached on GoDaddy."
  exit 0
fi

echo "PENDING: Update GoDaddy DNS for ${DOMAIN}, then re-run this script."
exit 1
