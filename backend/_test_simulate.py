# Quick local test to call the simulate function directly by loading the file
import asyncio
import importlib.util
import sys
from pathlib import Path

p = Path(__file__).resolve().parent / "main.py"
spec = importlib.util.spec_from_file_location("backend_main", str(p))
mod = importlib.util.module_from_spec(spec)
sys.modules["backend_main"] = mod
spec.loader.exec_module(mod)


async def run():
    res = await mod.simulate(event="stroke", samples=5, seed=123)
    print(res)


if __name__ == "__main__":
    asyncio.run(run())
