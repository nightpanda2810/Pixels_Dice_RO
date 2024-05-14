# Standard library imports
from collections import defaultdict, Counter
import asyncio

# Personal library imports

# Module imports
from modules.shared_state import SharedState

# Initialized variables
shared_state = SharedState()


async def average_mongo_data(state):
    while True:
        grouped_data = defaultdict(lambda: {"sum": 0, "count": 0, "totals": Counter()})
        for item in state.mongo_data:
            key = (item["die_name"], item["session_date"])
            grouped_data[key]["sum"] += item["last_roll"]
            grouped_data[key]["count"] += 1
            grouped_data[key]["totals"][item["last_roll"]] += 1
        averaged_data = {key: {"average": value["sum"] / value["count"], "totals": dict(value["totals"])} for key, value in grouped_data.items()}

        for (die_name, session_date), stats in averaged_data.items():
            avg_roll = stats["average"]
            totals = stats["totals"]
            state.average_rolls = f"\nOn {session_date}, the average roll for {die_name} was {int(avg_roll)}."
            print(state.average_rolls)
            for key, value in totals.items():
                print(f"You rolled {value} {key}")

        await asyncio.sleep(5)
