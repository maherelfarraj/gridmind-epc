@echo off
echo Starting AI Solar Design and SCADA Suite...
if not exist .env (
  copy .env.example .env
  echo Created .env from .env.example. Edit passwords before production.
)
docker-compose up --build -d
echo.
echo Dashboard: http://localhost:8501
echo API Docs:  http://localhost:8000/docs
echo Prometheus: http://localhost:9090
docker-compose ps
pause
