# GridMind EPC™ Domain Launch Addendum

## Target URL

Use this production subdomain:

```text
https://pvmind.ai
```

## DNS Record

Create this record in GoDaddy, Cloudflare, Namecheap, or your DNS manager:

| Type | Host / Name | Value |
|---|---|---|
| A | @ | YOUR_CLOUD_SERVER_PUBLIC_IP_ADDRESS |

## Server Deployment

SSH into the server, upload this project folder, then run:

```bash
cp .env.example .env
nano .env
chmod +x deploy_gridmind_server.sh
DOMAIN=pvmind.ai EMAIL=engineering@gsiuae.com ./deploy_gridmind_server.sh
```

## Nginx Routing

`nginx.conf` routes:

- `https://pvmind.ai` → Streamlit dashboard on port `8501`
- `https://pvmind.ai/api/v1/` → FastAPI backend on port `8000`
- `https://pvmind.ai/health` → API health check

## Final Restart

```bash
docker compose down
docker compose up --build -d
docker compose ps
```
