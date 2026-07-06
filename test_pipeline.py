from calculations import calculate_mv_cable_requirements, generate_bom_and_pricing, size_high_voltage_transformer


def test_medium_voltage_cable_sizing_bounds():
    result = calculate_mv_cable_requirements(block_power_kw=5000, line_voltage_v=33000, distance_meters=500)
    assert "size" in result
    assert "loss_pct" in result
    assert result["size"] in [50, 70, 95, 120, 150, 185, 240, 300, 400]
    assert result["loss_pct"] > 0.0


def test_high_voltage_transformer_thermal_derating():
    standard_mva = size_high_voltage_transformer(plant_mwp=50.0, ambient_temp=30.0)
    extreme_heat_mva = size_high_voltage_transformer(plant_mwp=50.0, ambient_temp=50.0)
    assert extreme_heat_mva >= standard_mva
    assert extreme_heat_mva in [25, 40, 63, 80, 100, 125, 160, 200, 250]


def test_bom_financial_totals():
    total, mod, trk, cab, sub, lab = generate_bom_and_pricing(
        total_trackers=100,
        calculated_mwp=5.0,
        total_cable_meters=2000,
        transformer_mva=10,
    )
    assert total == (mod + trk + cab + sub + lab)
    assert total > 0
