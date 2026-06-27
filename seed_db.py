import os
from pathlib import Path

import numpy as np
import pandas as pd
import psycopg2


def seed_enterprise_data():
    print("Connecting to PostgreSQL database container layer...")
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("POSTGRES_DB", "renewable_epc_ai"),
            user=os.getenv("POSTGRES_USER", "postgres_admin"),
            password=os.getenv("POSTGRES_PASSWORD", "SecureSecurePassword123!"),
        )
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS panel_inventory (
                panel_id SERIAL PRIMARY KEY,
                model_name VARCHAR(100) UNIQUE,
                wattage_w INT,
                unit_cost_usd NUMERIC(8,2)
            );
        """)
        cur.execute("SELECT COUNT(*) FROM panel_inventory;")
        if cur.fetchone()[0] == 0:
            cur.execute("""
                INSERT INTO panel_inventory (model_name, wattage_w, unit_cost_usd)
                VALUES
                    ('Trina Solar Vertex', 650, 117.00),
                    ('Jinko Solar Tiger', 600, 108.00),
                    ('Longi Hi-MO', 580, 104.40);
            """)
            print("Default panel inventory profiles injected into PostgreSQL.")
        conn.commit()
        cur.close()
        conn.close()
    except Exception as exc:
        print(f"Database seeding skipped or waiting for connection container: {exc}")

    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    csv_path = data_dir / "historical_inverter_logs.csv"
    if not csv_path.exists():
        print("Generating 1,000 synthetic historical SCADA profiles for AI pipeline...")
        np.random.seed(42)
        rows = 1000
        operating_hours = np.random.uniform(100, 25000, rows)
        internal_temp = np.random.uniform(30, 82, rows)
        dc_input_v = np.random.uniform(900, 1500, rows)
        base_efficiency = 0.985 - (operating_hours * 0.0000005) - (internal_temp * 0.0002)
        historical_efficiency = np.clip(base_efficiency + np.random.normal(0, 0.005, rows), 0.70, 0.99)
        ac_output_kw = (dc_input_v * 2.5) * historical_efficiency
        df = pd.DataFrame({
            "operating_hours": np.round(operating_hours, 1),
            "internal_temp_c": np.round(internal_temp, 1),
            "dc_input_v": np.round(dc_input_v, 1),
            "ac_output_kw": np.round(ac_output_kw, 1),
            "historical_efficiency": np.round(historical_efficiency, 4),
        })
        df.to_csv(csv_path, index=False)
        print(f"Created synthetic training log array: {csv_path}")


if __name__ == "__main__":
    seed_enterprise_data()
