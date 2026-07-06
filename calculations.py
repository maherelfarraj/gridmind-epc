"""Pure engineering calculation functions, free of Streamlit dependencies."""
import math


def calculate_mv_cable_requirements(block_power_kw: float, line_voltage_v: float, distance_meters: float) -> dict:
    power_factor = 0.95
    line_current = block_power_kw * 1000 / (math.sqrt(3) * line_voltage_v * power_factor)
    standard_sizes = [50, 70, 95, 120, 150, 185, 240, 300, 400]
    ampacity_limits = {50: 145, 70: 175, 95: 210, 120: 240, 150: 270, 185: 310, 240: 360, 300: 410, 400: 470}
    selected_size = next((s for s in standard_sizes if ampacity_limits[s] >= line_current), 400)
    resistance = (2.82e-8 * distance_meters) / (selected_size * 1e-6)
    loss_pct = (3 * (line_current ** 2) * resistance / (block_power_kw * 1000)) * 100
    return {"size": selected_size, "loss_pct": round(loss_pct, 3), "line_current_a": round(line_current, 2)}


def size_high_voltage_transformer(plant_mwp: float, ambient_temp: float) -> int:
    base_mva = plant_mwp / 0.95
    derating_factor = max(0.55, 1.0 - (max(0, ambient_temp - 30.0) * 0.01))
    standard_sizes = [25, 40, 63, 80, 100, 125, 160, 200, 250]
    return next((s for s in standard_sizes if s >= (base_mva / derating_factor)), 250)


def generate_bom_and_pricing(total_trackers: int, calculated_mwp: float, total_cable_meters: float, transformer_mva: float) -> tuple:
    price_book = {"tracker": 1850.0, "pv": 0.18, "cable": 24.5, "tx": 11500.0, "labor": 450.0}
    mod = (calculated_mwp * 1_000_000) * price_book["pv"]
    trk = total_trackers * price_book["tracker"]
    cab = total_cable_meters * price_book["cable"]
    sub = transformer_mva * price_book["tx"]
    lab = total_trackers * price_book["labor"]
    total = mod + trk + cab + sub + lab
    return total, mod, trk, cab, sub, lab
