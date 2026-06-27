# Full Launch Guide — GitHub + Vercel + Cursor + Lovable + Supabase

## Target architecture

| Layer | Tool | Purpose |
|---|---|---|
| UI/UX generation | Lovable | Generate premium dashboard screens |
| Code editor | Cursor | Edit, merge, debug, and extend code |
| Source control | GitHub | Repository, version history, CI |
| Frontend hosting | Vercel | Next.js production hosting |
| Database/Auth | Supabase | PostgreSQL, Auth, Realtime, Storage |
| Legacy local demo | Docker | Streamlit/FastAPI local stack |

## Recommended production flow

1. Design UI in Lovable.
2. Export Lovable code.
3. Open project in Cursor.
4. Merge screens into `web/`.
5. Connect Supabase database.
6. Push to GitHub.
7. Import GitHub repository into Vercel.
8. Add Supabase environment variables in Vercel.
9. Add production domain.
10. Test dashboard, calculation API, PDF export, and database save.

## Vercel settings

- Framework: Next.js
- Root Directory: `web`
- Build Command: `npm run build`
- Install Command: `npm install`
- Output: default Next.js

## Environment variables

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

## GitHub commands

```bash
git init
git add .
git commit -m "GridMind EPC Vercel Supabase upgrade"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/gridmind-epc.git
git push -u origin main
```

## Supabase SQL

Run:

```text
supabase/schema.sql
```

## Local test

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

## Production test checklist

- Landing page loads.
- Dashboard loads.
- Calculation updates metrics instantly.
- "Calculate + Save to Supabase" inserts into `design_runs`.
- "Download Branded PDF Proposal" downloads a PDF.
- Vercel deployment succeeds.
- Domain works with HTTPS.


## Final Domain

Use:

```text
https://gridmindepc.com
```

In Vercel, add both:

```text
gridmindepc.com
www.gridmindepc.com
```

Then configure DNS using the records Vercel displays.
