# Supabase → Vercel setup

## Quick ship (one command)

On your machine with `gh auth login` as repo owner:

```bash
./scripts/ship-supabase-config.sh
```

Paste values from **Supabase → Project Settings → API**:

| GitHub secret | Supabase field |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role |

The script saves GitHub secrets, syncs to Vercel (if `VERCEL_TOKEN` is set), and runs **Vercel Production Setup**.

## Manual alternative

1. Add the three secrets at https://github.com/maherelfarraj/gridmind-epc/settings/secrets/actions
2. Run **Actions → Vercel Production Setup → Run workflow**

## Database schema

Run once in Supabase SQL Editor:

```text
supabase/schema.sql
```

## Troubleshooting “secrets added” but workflow still fails

GitHub Actions needs **exact** secret names at **repository** secrets (or Production environment):

| Required name | Common mistake |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_KEY` |

Check: https://github.com/maherelfarraj/gridmind-epc/settings/secrets/actions

Or **Production** environment secrets:  
https://github.com/maherelfarraj/gridmind-epc/settings/environments/Production

If you added vars only in **Vercel** (not GitHub), open Vercel → gridmindepc → Settings → Environment Variables and add the same three keys there, then redeploy.

## Verify

```bash
curl -s -X POST https://gridmindepc.vercel.app/api/calculate \
  -H 'Content-Type: application/json' \
  -d '{"capacityMw":50,"moduleWatt":650,"inverterKw":3500}'
```

Without Supabase: response includes `"warning": "Supabase env not configured..."`  
With Supabase: response includes `"saved": true` and a `designRunId`.
