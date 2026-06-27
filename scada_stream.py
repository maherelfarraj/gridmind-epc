import datetime
import json
import os

import paho.mqtt.client as mqtt


MQTT_BROKER = os.getenv("MQTT_BROKER", "mqtt_broker")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
SCADA_TOPIC = os.getenv("SCADA_TOPIC", "gsi/substation/main_transformer/telemetry")


def on_connect(client, userdata, flags, rc):
    print(f"[{datetime.datetime.utcnow()}] Connected to MQTT broker with rc={rc}")
    client.subscribe(SCADA_TOPIC)


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        oil_temp = float(payload.get("transformer_oil_temp_c", 0.0))
        gas_ppm = float(payload.get("dissolved_gas_ppm", 0.0))
        load_mva = float(payload.get("grid_throughput_mva", 0.0))
        trip_flag = oil_temp >= 95 or gas_ppm >= 250 or load_mva >= 250
        print(json.dumps({
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "topic": msg.topic,
            "oil_temp_c": oil_temp,
            "gas_ppm": gas_ppm,
            "load_mva": load_mva,
            "trip_flag": trip_flag,
        }))
    except Exception as exc:
        print(f"SCADA message parse error: {exc}")


def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_forever()


if __name__ == "__main__":
    main()
