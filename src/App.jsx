import React, { useState } from "react";
import axios from "axios";
import HumanModel from "./components/HumanModel";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import "./App.css";

function App() {
  const [data, setData] = useState(null);
  const [severity, setSeverity] = useState(1);
  const [selectedScenario, setSelectedScenario] = useState("stroke");
  const [eventText, setEventText] = useState("");

  const severityMap = {
    stroke: 3,
    hemorrhage: 2,
    hypertension: 1,
    seizure: 3,
  };

  const backendURL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

  const runSimulation = async () => {
    try {
      const eventToSend = eventText && eventText.trim().length > 0 ? eventText.trim() : selectedScenario;
      const res = await axios.get(`${backendURL}/simulate`, {
        params: { event: eventToSend, samples: 20 },
      });
      setData(res.data);
      const matched = res.data.matched_event || res.data.requested_event;
      setSeverity(severityMap[matched] || 1);
    } catch (err) {
      console.error("Error fetching simulation:", err);
      alert("Backend not responding. Did you start the backend server (uvicorn)?");
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">🧠 PhysioSim XR</h1>

      <div className="card">
        {/* Free-text event (takes precedence) */}
        <input
          className="event-input"
          placeholder="Type an event (e.g. 'stroke' or 'earthquake')"
          value={eventText}
          onChange={(e) => setEventText(e.target.value)}
        />

        {/* Dropdown to choose scenario (used when input is empty) */}
        <select
          className="scenario-select"
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
        >
          <option value="stroke">Stroke</option>
          <option value="hemorrhage">Hemorrhage</option>
          <option value="hypertension">Hypertension</option>
          <option value="seizure">Seizure</option>
        </select>

        {data && (
          <HumanModel
            scenario={data.matched_event || data.requested_event}
            severity={severity}
          />
        )}
        <button className="simulate-btn" onClick={runSimulation}>
          Run Simulation
        </button>

        {data && (
          <>
            <h2 className="result-title">Scenario: {data.matched_event || data.requested_event}</h2>
            <div className="chart-container">
              <Line
                data={{
                  labels: Array.from(
                    { length: data.values.length },
                    (_, i) => i + 1
                  ),
                  datasets: [
                    {
                      label: "Simulation Output",
                      data: data.values,
                      borderColor: "rgba(255,99,132,1)",
                      backgroundColor: "rgba(255,99,132,0.2)",
                      borderWidth: 2,
                      tension: 0.3,
                    },
                  ],
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
