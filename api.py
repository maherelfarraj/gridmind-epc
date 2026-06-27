import os
import math
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel


app = FastAPI(title="GSI Solar AI Engineering Core API", version="1.0.0")
security = HTTPBasic()


class DesignRequest(BaseModel):
    plant_mwp: float
    ambient_temp_c: float


class CableRequest(BaseModel):
    block_power_kw: float
    line_voltage_v: float = 33000
    distance_meters: float


def validate_api_credentials(credentials: HTTPBasicCredentials = Depends(security)) -> str:
    expected_user = os.getenv("API_USER", "gsi_api_gate")
    expected_password = os.getenv("API_PASSWORD", "GSI_Secure_API_2026!")
    if credentials.username != expected_user or credentials.password != expected_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    return credentials.username


@app.get("/health")
def health():
    return {"status": "ok", "service": "solar-epc-ai-api"}


@app.post("/api/v1/calculate-grid-specs")
def calculate_grid_specs(request: DesignRequest, username: str = Depends(validate_api_credentials)):
    base_mva = request.plant_mwp / 0.95
    derating_factor = max(0.55, 1.0 - (max(0, request.ambient_temp_c - 30.0) * 0.01))
    mva_required = base_mva / derating_factor
    standard_transformers = [25, 40, 63, 80, 100, 125, 160, 200, 250]
    selected_mva = next((s for s in standard_transformers if s >= mva_required), 250)
    return {"recommended_transformer_mva": selected_mva, "required_mva_before_rounding": round(mva_required, 2)}


@app.post("/api/v1/calculate-cable")
def calculate_cable(request: CableRequest, username: str = Depends(validate_api_credentials)):
    power_factor = 0.95
    line_current = request.block_power_kw * 1000 / (math.sqrt(3) * request.line_voltage_v * power_factor)
    standard_sizes = [50, 70, 95, 120, 150, 185, 240, 300, 400]
    ampacity_limits = {50: 145, 70: 175, 95: 210, 120: 240, 150: 270, 185: 310, 240: 360, 300: 410, 400: 470}
    selected_size = next((s for s in standard_sizes if ampacity_limits[s] >= line_current), 400)
    resistance = (2.82e-8 * request.distance_meters) / (selected_size * 1e-6)
    loss_pct = (3 * (line_current ** 2) * resistance / (request.block_power_kw * 1000)) * 100
    return {"selected_conductor_mm2": selected_size, "line_current_a": round(line_current, 2), "loss_pct": round(loss_pct, 3)}
