import numpy as np
from scipy.integrate import odeint


def cardiovascular_model(y, t, params):
    BP, HR = y
    k1, k2, set_point, resistance, blood_loss = params
    dBPdt = k1 * (HR * resistance) - blood_loss - 0.1 * BP
    dHRdt = k2 * (set_point - BP) - 0.05 * (HR - 70)
    return [dBPdt, dHRdt]


def run_simulation(scenario: str):
    t = np.linspace(0, 60, 200)
    y0 = [120, 75]
    params = [0.05, 0.1, 100, 1.0, 0.0]

    if scenario == "stroke":
        params = [0.05, 0.1, 100, 0.7, 0.0]
    elif scenario == "hypertension":
        params = [0.05, 0.1, 120, 1.3, 0.0]
    elif scenario == "hemorrhage":
        params = [0.05, 0.1, 100, 1.0, 0.5]

    sol = odeint(cardiovascular_model, y0, t, args=(params,))
    BP = sol[:, 0]
    HR = sol[:, 1]
    O2 = np.clip(98 - 0.05 * np.maximum(0, 90 - BP), 85, 100)

    return {
        "time": t.tolist(),
        "blood_pressure": BP.tolist(),
        "heart_rate": HR.tolist(),
        "oxygen_saturation": O2.tolist(),
    }


def explain_results(scenario: str, vitals: dict) -> str:
    bp_final = vitals["blood_pressure"][-1]
    hr_final = vitals["heart_rate"][-1]
    o2_final = vitals["oxygen_saturation"][-1]

    if scenario == "stroke":
        return (
            f"In a stroke simulation, resistance dropped, lowering blood pressure "
            f"to about {bp_final:.1f} mmHg. Heart rate compensated to ~{hr_final:.1f} bpm. "
            f"Oxygen saturation dropped to {o2_final:.1f}%."
        )
    elif scenario == "hypertension":
        return (
            f"Blood pressure stabilized higher at {bp_final:.1f} mmHg, "
            f"heart rate ~{hr_final:.1f} bpm. O₂ remained {o2_final:.1f}%."
        )
    elif scenario == "hemorrhage":
        return (
            f"Blood loss dropped BP to {bp_final:.1f} mmHg. "
            f"Heart rate rose to {hr_final:.1f} bpm. O₂ dropped to {o2_final:.1f}%."
        )
    else:
        return (
            f"Vitals stable: BP {bp_final:.1f} mmHg, HR {hr_final:.1f} bpm, "
            f"O₂ {o2_final:.1f}%."
        )
