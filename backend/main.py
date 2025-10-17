from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import random
from typing import Callable, Dict, Any, List, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] for tighter security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _time_series(mean: float, std: float, samples: int) -> List[float]:
    """Generate a simple gaussian-like time series around mean with some jitter."""
    return [round(random.gauss(mean, std), 2) for _ in range(samples)]


def _stroke_generator(samples: int) -> Dict[str, Any]:
    # stroke: sudden changes in oxygenation/heart metrics — simulate heart rate variability
    values = _time_series(90, 15, samples)
    # add a drop/spike to simulate acute event
    if samples >= 3:
        idx = random.randrange(samples)
        values[idx] = round(values[idx] * random.uniform(0.4, 1.8), 2)
    return {
        "type": "stroke",
        "description": "Acute cardiovascular event pattern",
        "values": values,
    }


def _hemorrhage_generator(samples: int) -> Dict[str, Any]:
    # hemorrhage: falling blood pressure / rising heart rate
    base = _time_series(120, 6, samples)
    # simulate downward trend
    trend = [round(base[i] - (i * random.uniform(0.5, 2.0)), 2) for i in range(samples)]
    return {
        "type": "hemorrhage",
        "description": "Progressive drop in pressure consistent with bleeding",
        "values": trend,
    }


def _hypertension_generator(samples: int) -> Dict[str, Any]:
    values = _time_series(150, 8, samples)
    return {
        "type": "hypertension",
        "description": "Elevated blood pressure readings",
        "values": values,
    }


def _seizure_generator(samples: int) -> Dict[str, Any]:
    # seizures: rapid oscillatory signals with spikes
    values = [round(random.uniform(-1.0, 1.0) * 10, 2) for _ in range(samples)]
    for _ in range(max(1, samples // 5)):
        i = random.randrange(samples)
        values[i] = round(values[i] + random.uniform(20, 80), 2)
    return {
        "type": "seizure",
        "description": "Burst-like spike activity",
        "values": values,
    }


def _generic_generator(event: str, samples: int) -> Dict[str, Any]:
    # Fallback: create a normalized 0-100 series with occasional spikes that reflect word length
    base = [
        round(random.uniform(30, 70) + (len(event) % 5) * random.uniform(-5, 5), 2)
        for _ in range(samples)
    ]
    # sprinkle a few spikes
    for _ in range(max(1, samples // 8)):
        i = random.randrange(samples)
        base[i] = round(base[i] * random.uniform(0.2, 2.5), 2)
    return {
        "type": "generic",
        "description": f"Generic simulation for '{event}'",
        "values": base,
    }


# Registry of simple simulators keyed by keyword -> generator(samples) function
SIMULATORS: Dict[str, Callable[[int], Dict[str, Any]]] = {
    "stroke": _stroke_generator,
    "hemorrhage": _hemorrhage_generator,
    "hypertension": _hypertension_generator,
    "seizure": _seizure_generator,
}


def _match_simulator(event: Optional[str]) -> Optional[Callable[[int], Dict[str, Any]]]:
    """Return a simulator function that best matches the user-supplied event string.

    Matching is keyword-based and falls back to None when no good match is found.
    """
    if not event:
        return None
    e = event.lower()
    # direct keyword match
    for key in SIMULATORS:
        if key in e:
            return SIMULATORS[key]
    # no match
    return None


@app.get("/simulate")
async def simulate(
    event: str = Query(
        None, description="Free-text event to simulate (e.g. 'stroke', 'earthquake')"
    ),
    samples: int = Query(10, ge=1, le=1000),
    seed: int = Query(None),
):
    """Simulate any user-supplied event. The endpoint will try to match the event text to
    a known simulator and otherwise provide a reasonable generic fallback.

    Query params:
    - event: free-text description of the event to simulate. If omitted a random known event is chosen.
    - samples: number of data points to return (1-1000)
    - seed: optional random seed for reproducible output
    """
    if seed is not None:
        random.seed(seed)

    # If nothing provided, pick a random known event
    if not event:
        event = random.choice(list(SIMULATORS.keys()))

    # Parameter validation done by FastAPI for `samples` via Query already.

    sim_fn = _match_simulator(event)
    if sim_fn:
        result = sim_fn(samples)
        matched = result.get("type")
    else:
        # fallback generic generator
        result = _generic_generator(event, samples)
        matched = "generic"

    response = {
        "requested_event": event,
        "matched_event": matched,
        "description": result.get("description"),
        "samples": samples,
        "values": result.get("values"),
    }

    return response


if __name__ == "__main__":
    # Quick runner for local testing (uvicorn optional)
    try:
        # import uvicorn dynamically so static linters won't require it to be installed
        import importlib

        uvicorn = importlib.import_module("uvicorn")
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception:
        # If uvicorn isn't available or running fails, just print a hint
        print("Run this app with: uvicorn backend.main:app --reload --port 8000")
