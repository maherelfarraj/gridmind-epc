#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-pvmind.ai}"
EMAIL="${EMAIL:-engineering@gsiuae.com}"

echo "Starting GridMind EPC deployment for $DOMAIN"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Edit passwords before public launch."
fi

docker compose down || docker-compose down || true
docker compose up --build -d || docker-compose up --build -d

sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

sudo cp nginx.conf /etc/nginx/sites-available/gridmind-epc
sudo ln -sf /etc/nginx/sites-available/gridmind-epc /etc/nginx/sites-enabled/gridmind-epc
sudo nginx -t
sudo systemctl reload nginx

sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect

echo "GridMind EPC is deployed at https://$DOMAIN"
