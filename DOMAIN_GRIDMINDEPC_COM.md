# GridMind EPC™ Domain Setup — gridmindepc.com

## Final production URL

```text
https://gridmindepc.com
```

## Recommended Vercel setup

1. Push the project to GitHub.
2. Import the GitHub repository into Vercel.
3. Set the Vercel root directory to:

```text
web
```

4. Add these environment variables in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://gridmindepc.com
```

5. In Vercel, open **Project → Settings → Domains**.
6. Add:

```text
gridmindepc.com
www.gridmindepc.com
```

## DNS records

If your domain is managed in GoDaddy, add the records Vercel gives you. Usually:

| Type | Name | Value |
|---|---|---|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

Use the exact values Vercel shows in the domain setup screen.

## Final test checklist

- `https://gridmindepc.com` opens the landing page.
- `https://gridmindepc.com/dashboard` opens the GridMind EPC™ dashboard.
- Calculation cards update instantly.
- “Calculate + Save to Supabase” saves a record in `design_runs`.
- “Download Branded PDF Proposal” downloads the proposal PDF.
- SSL/HTTPS is active.
