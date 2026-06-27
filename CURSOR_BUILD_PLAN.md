# Cursor Build Plan — GridMind EPC™ Modern SaaS Upgrade

## Step 1 — Open the project
Open this folder in Cursor.

## Step 2 — Use the new production frontend
Work inside:

```text
web/
```

The old Python files remain available for local Docker demos. The Vercel production path is the Next.js app.

## Step 3 — Install locally

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

## Step 4 — Supabase setup
1. Create a Supabase project.
2. Open SQL Editor.
3. Run:

```text
supabase/schema.sql
```

4. Copy Supabase URL and anon key into `web/.env.local`.
5. Copy service role key into `web/.env.local` for server-side API inserts.

## Step 5 — GitHub

```bash
git init
git add .
git commit -m "Upgrade GridMind EPC to Vercel Supabase SaaS stack"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/gridmind-epc.git
git push -u origin main
```

## Step 6 — Vercel deployment
1. Go to Vercel.
2. Import the GitHub repository.
3. Set Root Directory to:

```text
web
```

4. Add environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_APP_URL

5. Deploy.

## Step 7 — Lovable
Use `LOVABLE_PROMPT.md` to generate or polish UI screens, then export code and merge into `web/`.

## Step 8 — Production domain
In Vercel:
- Add domain `gridmindepc.com`
- Copy Vercel DNS target
- Add CNAME in DNS:
  - Host: gridmind
  - Value: cname.vercel-dns.com or the Vercel-provided target

## Step 9 — Next upgrades
- Add Supabase Auth login.
- Add project list page.
- Add design history page.
- Add realtime SCADA table.
- Add CSV import for SCADA logs.
- Add role-based permissions.
