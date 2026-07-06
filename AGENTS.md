# AGENTS.md

## Cursor Cloud specific instructions

This repo contains two independent products:

1. **`web/`** — Next.js 14 + TypeScript + Tailwind app ("PV_Mind Cockpit", GridMind EPC). This is the primary product and the focus of active development. It runs fully standalone: all project data is persisted in the browser's `localStorage` (see `web/lib/storage.ts`), so **no Supabase or database is required** to run or test the cockpit. Supabase is only used opportunistically by `web/app/api/calculate/route.ts` to save a design run; if the `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` env vars are absent it returns the calculation with a `warning` and skips the DB save (no error).
2. **Python engineering stack** (repo root) — a Streamlit dashboard (`app.py`), a FastAPI API (`api.py`), an ML pipeline (`inverter_ml_pipeline.py`), a mock SCADA stream (`scada_stream.py`), and DB seeding (`seed_db.py`). `docker-compose.yml` wires these together with Postgres, Mosquitto (MQTT), and Prometheus, but Docker is **not** required for local dev — `app.py`, `api.py`, and `pytest`'s target functions run directly. Postgres/MQTT are only needed for `seed_db.py` and the (optional) live SCADA/ML paths.

### Dependencies
- Node deps: installed by the update script (`npm install --prefix web`).
- Python deps: installed by the update script (`python3 -m pip install -r requirements.txt`). These install to the user/global site-packages (no virtualenv). Console scripts (`streamlit`, `uvicorn`, `pytest`) land in `~/.local/bin`, which is **not on `PATH`** — invoke them via the module form (`python3 -m streamlit ...`, `python3 -m uvicorn ...`, `python3 -m pytest`) to avoid "command not found".

### Running the services
- **Web cockpit (primary):** `cd web && npm run dev` → http://localhost:3000 . Landing page → "Create New Project" wizard (pre-filled defaults; you can jump straight to the "Review & Create" step) → project detail. Static checks/build: `npm run typecheck` and `npm run build` (this is what CI runs, see `.github/workflows/vercel-preview.yml`).
- **FastAPI:** `python3 -m uvicorn api:app --host 0.0.0.0 --port 8000` → http://localhost:8000/docs . Protected endpoints use HTTP Basic; default creds are `gsi_api_gate` / `GSI_Secure_API_2026!` (overridable via `API_USER` / `API_PASSWORD`).
- **Streamlit dashboard:** `python3 -m streamlit run app.py --server.port=8501 --server.address=0.0.0.0 --server.headless=true` → http://localhost:8501 . Demo login: `engineer_amman` / `GSI_Jordan_2026!` (see `.env.example` / README for the developer login).

### Known caveats / gotchas
- **`next lint` is not usable non-interactively:** no ESLint config is committed, so `npm run lint` prompts to configure ESLint and blocks. CI does not run lint — it runs `npm run typecheck` + `npm run build`. Use `npm run typecheck` as the static-analysis/lint step.
- **`pytest` fails at collection (pre-existing code issue, not an env problem):** `test_pipeline.py` imports pure functions from `app.py`, but importing `app.py` executes the Streamlit script top-to-bottom. Outside the `streamlit run` runtime, `st.stop()` does not halt execution, so the login-gate code continues and raises `KeyError: 'st.session_state has no key "user_role"'`. Running under `streamlit run` is the only context where the module short-circuits. Do not "fix" this as part of environment setup.
- Supabase env vars are optional for the web app (see above); do not treat them as required to run/test the cockpit.
