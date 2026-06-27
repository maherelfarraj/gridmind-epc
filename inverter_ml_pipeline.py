from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split


DATA_PATH = Path("data/historical_inverter_logs.csv")
MODEL_PATH = Path("models/inverter_efficiency_rf.joblib")


def train_model(data_path: Path = DATA_PATH, model_path: Path = MODEL_PATH) -> dict:
    if not data_path.exists():
        raise FileNotFoundError(f"Training data not found: {data_path}. Run seed_db.py first.")

    df = pd.read_csv(data_path)
    features = ["operating_hours", "internal_temp_c", "dc_input_v"]
    target = "historical_efficiency"
    x_train, x_test, y_train, y_test = train_test_split(df[features], df[target], test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=150, random_state=42, max_depth=8)
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    mae = mean_absolute_error(y_test, predictions)

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)
    return {"model_path": str(model_path), "mae": round(float(mae), 6), "rows": len(df)}


def predict_efficiency(operating_hours: float, internal_temp_c: float, dc_input_v: float, model_path: Path = MODEL_PATH) -> float:
    if not model_path.exists():
        train_model()
    model = joblib.load(model_path)
    data = pd.DataFrame([{
        "operating_hours": operating_hours,
        "internal_temp_c": internal_temp_c,
        "dc_input_v": dc_input_v,
    }])
    return float(np.clip(model.predict(data)[0], 0.70, 0.99))


if __name__ == "__main__":
    print(train_model())
    print({"sample_prediction": predict_efficiency(12000, 48, 1180)})
