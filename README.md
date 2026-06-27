# AI Utility-Scale Solar Design & SCADA Engine

This repository packages the full launchable system described in the system manual:

- Streamlit engineering dashboard
- FastAPI engineering API gateway
- PostgreSQL inventory database
- Mock SCADA / MQTT stream processor
- Inverter ML training pipeline
- Database + synthetic SCADA seeding
- Pytest validation suite
- Docker Compose orchestration
- GitHub Actions CI

## Quick Launch on Windows

1. Install Docker Desktop.
2. Unzip this project.
3. Open Command Prompt inside the folder.
4. Run:

```bat
copy .env.example .env
notepad .env
start_local.bat
```

Then open:

- Dashboard: http://localhost:8501
- API documentation: http://localhost:8000/docs
- Prometheus: http://localhost:9090

## Quick Launch on Mac / Linux

```bash
cp .env.example .env
nano .env
docker-compose up --build -d
docker-compose ps
```

## Demo Login

Default credentials are included only for local testing:

- engineer_amman / GSI_Jordan_2026!
- developer_uae / GSI_Dubai_2026!

Change all credentials inside `.env` before production.

## Train the ML Model

```bash
docker-compose run --rm seed_runner
docker-compose run --rm ai_platform python inverter_ml_pipeline.py
```

## Test

```bash
pytest -q
```

## Production Launch Checklist

- Replace all `.env` secrets.
- Move PostgreSQL to managed cloud database for production.
- Add real OAuth/SSO instead of demo password login.
- Connect live MQTT/SCADA source.
- Configure domain and SSL.
- Deploy to a Docker VPS, Azure Container Apps, AWS ECS, or Render.


## GridMind EPC™ Branded Proposal Upgrade

This updated package includes:

- `proposal_generator.py` for branded GridMind EPC™ engineering bid PDFs.
- A dashboard PDF download button after the design calculation finishes.
- `nginx.conf` for routing the dashboard and API through `gridmindepc.com`.
- `deploy_gridmind_server.sh` for Docker restart, Nginx setup, and Let's Encrypt SSL.
- `DEPLOYMENT_DOMAIN.md` with DNS and server launch steps.

Recommended production URL:

```text
https://gridmindepc.com
```


## Vercel + Supabase + Cursor + Lovable Upgrade

This package now includes a modern production SaaS path:

- `web/` — Next.js 14 + TypeScript + Tailwind frontend for Vercel.
- `supabase/schema.sql` — PostgreSQL schema, RLS policies, and seed inventory.
- `LOVABLE_PROMPT.md` — prompt to generate the premium UI in Lovable.
- `CURSOR_BUILD_PLAN.md` — step-by-step Cursor development workflow.
- `GITHUB_VERCEL_SUPABASE_LAUNCH.md` — full launch guide.
- `.cursor/rules` — Cursor project rules.
- `.github/workflows/vercel-preview.yml` — CI build for the Next.js app.
- `vercel.json` — deployment settings.

Production recommendation:
Use the Next.js app in `web/` for Vercel, Supabase for Auth/database/realtime, and keep the Docker Python stack for engineering demos or backend prototypes.
