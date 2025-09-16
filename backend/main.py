from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] for tighter security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/simulate")
async def simulate(scenario: str = Query(None)):
    scenarios = ["stroke", "hemorrhage", "hypertension"]

    # If no scenario passed, pick random
    if scenario not in scenarios:
        scenario = random.choice(scenarios)

    values = [random.randint(60, 180) for _ in range(10)]
    return {"scenario": scenario, "values": values}
