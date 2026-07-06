import hashlib
import os
from pathlib import Path
import psutil
from datetime import datetime

import numpy as np
import pandas as pd
import streamlit as st
from proposal_generator import generate_branded_proposal
from calculations import (
    calculate_mv_cable_requirements,
    size_high_voltage_transformer,
    generate_bom_and_pricing,
)


st.set_page_config(page_title="AI Solar Design & SCADA Suite", layout="wide")


def hash_password(password: str) -> str:
    return hashlib.sha256(str(password).encode("utf-8")).hexdigest()


def check_user_credentials(username: str, password: str) -> bool:
    users = {
        os.getenv("APP_ENGINEER_USER", "engineer_amman"): hash_password(os.getenv("APP_ENGINEER_PASSWORD", "GSI_Jordan_2026!")),
        os.getenv("APP_DEVELOPER_USER", "developer_uae"): hash_password(os.getenv("APP_DEVELOPER_PASSWORD", "GSI_Dubai_2026!")),
    }
    return users.get(username) == hash_password(password)


if "authenticated" not in st.session_state:
    st.session_state["authenticated"] = False

if not st.session_state["authenticated"]:
    st.title("🔐 EPC Portal Access Gate")
    st.caption("Default demo users are available only for local testing. Change credentials before production.")
    user = st.text_input("Username")
    pwd = st.text_input("Password", type="password")
    if st.button("Login", type="primary"):
        if check_user_credentials(user, pwd):
            st.session_state["authenticated"] = True
            st.session_state["user_role"] = "Senior Engineer" if "engineer" in user else "Project Developer"
            st.rerun()
        else:
            st.error("Invalid credentials.")
    st.stop()

st.title("⚡ AI Solar & Grid Infrastructure Suite")
st.sidebar.markdown(f"**Operator:** {st.session_state['user_role']}")
st.sidebar.markdown(f"**Session:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
if st.sidebar.button("Logout"):
    st.session_state.clear()
    st.rerun()

tab1, tab2, tab3, tab4 = st.tabs(["🏗️ AI Design Layout", "📊 SCADA Asset Monitoring", "🤖 ML Diagnostics", "🖥️ Server Health"])

with tab1:
    st.header("Generative System Setup & Financial Optimization")
    col1, col2 = st.columns(2)
    with col1:
        project_name = st.text_input("Project / Asset Name", value="GridMind EPC Demonstration Plant")
        input_capacity = st.number_input("Target Capacity (MWp)", min_value=1.0, value=60.0, step=1.0)
        trackers_count = st.number_input("Calculated Tracker Structures", min_value=1, value=1650, step=10)
        cable_length = st.number_input("Est. MV Collection Cables (Meters)", min_value=100, value=12400, step=100)
        ambient_temp = st.slider("Max Ground Design Temp (°C)", 30, 55, 45)
        run_design = st.button("🚀 Process Automation Pipeline", type="primary")

    with col2:
        if run_design:
            tx_mva = size_high_voltage_transformer(input_capacity, ambient_temp)
            mv_data = calculate_mv_cable_requirements(input_capacity * 1000, 33000, cable_length / 10)
            total, mod, trk, cab, sub, lab = generate_bom_and_pricing(trackers_count, input_capacity, cable_length, tx_mva)
            st.session_state["last_design"] = {
                "project_name": project_name,
                "capacity_mwp": input_capacity,
                "total": total,
                "tx_mva": tx_mva,
                "cable_size": mv_data["size"],
                "loss_pct": mv_data["loss_pct"],
                "bom": {
                    "PV Modules": mod,
                    "Tracker Structures": trk,
                    "MV Collection Cable": cab,
                    "Transformer/Substation": sub,
                    "Installation Labor": lab,
                },
            }
            st.success("Calculations complete.")
            st.metric("Total EPC Gross CAPEX", f"${total:,.2f} USD")
            st.metric("Recommended Transformer", f"{tx_mva} MVA")
            st.metric("Optimum MV Conductor", f"{mv_data['size']} mm² Al")
            st.metric("Estimated Cable Losses", f"{mv_data['loss_pct']:.2f}%")
            st.dataframe(pd.DataFrame([
                ["PV Modules", mod],
                ["Tracker Structures", trk],
                ["MV Collection Cable", cab],
                ["Transformer/Substation", sub],
                ["Installation Labor", lab],
            ], columns=["BOM Category", "Cost USD"]), use_container_width=True)

            pdf_path = generate_branded_proposal(
                project_name=project_name,
                capacity_mwp=input_capacity,
                total_cost=total,
                tx_mva=tx_mva,
                cable_size=mv_data["size"],
                output_path=f"GridMind_Proposal_{project_name.replace(' ', '_')}.pdf",
            )
            with open(pdf_path, "rb") as file:
                st.download_button(
                    label="📥 Download Branded GridMind EPC™ PDF Proposal",
                    data=file,
                    file_name=Path(pdf_path).name,
                    mime="application/pdf",
                    use_container_width=True,
                )
        else:
            st.info("Enter design values and run the automation pipeline.")

with tab2:
    st.header("📡 Live Grid Transmission Asset Stream")
    if st.toggle("Activate Live SCADA Monitoring"):
        history = pd.DataFrame({
            "Oil Temp (°C)": [41.2, 41.5, 41.9, 42.1, 42.5, 42.3],
            "Throughput Load (MVA)": [39.2, 40.4, 41.8, 43.2, 44.0, 44.1],
            "Dissolved Gas (PPM)": [28, 29, 30, 31, 32, 32],
        })
        m1, m2, m3 = st.columns(3)
        m1.metric("Transformer Oil Temp", "42.3 °C", "-0.4 °C")
        m2.metric("Dissolved Gas Concentration", "32 PPM", "0 PPM")
        m3.metric("Grid Throughput Load", "44.1 MVA", "+2.3 MVA")
        st.area_chart(history)
    else:
        st.info("SCADA view is in demo mode until a live MQTT broker and sensor payload are connected.")

with tab3:
    st.header("Predictive Inverter Aging Diagnostics")
    hours = st.slider("Operating Hours", 100, 25000, 12000)
    temp = st.slider("Internal Temperature °C", 30, 82, 48)
    dc_v = st.slider("DC Input Voltage", 900, 1500, 1180)
    estimated_efficiency = max(0.70, min(0.99, 0.985 - (hours * 0.0000005) - (temp * 0.0002)))
    ac_output_kw = (dc_v * 2.5) * estimated_efficiency
    st.metric("Estimated Efficiency", f"{estimated_efficiency:.4f}")
    st.metric("Estimated AC Output", f"{ac_output_kw:,.1f} kW")
    if estimated_efficiency < 0.92:
        st.warning("Efficiency degradation requires maintenance review.")
    else:
        st.success("Inverter efficiency remains inside acceptable range.")

with tab4:
    st.header("Infrastructure Diagnostic Core")
    cpu = psutil.cpu_percent(interval=0.3)
    ram = psutil.virtual_memory().percent
    st.progress(cpu / 100, text=f"AI Engine CPU Load: {cpu}%")
    st.progress(ram / 100, text=f"RAM Buffer Consumption: {ram}%")
