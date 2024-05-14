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
        grouped_data = defaultdict(lambda: {"sum": 0, "count": 0, "totals": Counter(), "last_rolls": []})

        for item in state.mongo_data:
            key = (item["die_name"], item["session_date"])
            grouped_data[key]["sum"] += item["last_roll"]
            grouped_data[key]["count"] += 1
            grouped_data[key]["totals"][item["last_roll"]] += 1

            if len(grouped_data[key]["last_rolls"]) >= 10:
                grouped_data[key]["last_rolls"].pop(0)
            grouped_data[key]["last_rolls"].append(item["last_roll"])

        averaged_data = {key: {"average": value["sum"] / value["count"], "totals": dict(value["totals"]), "last_rolls": value["last_rolls"]} for key, value in grouped_data.items()}

        for (die_name, session_date), stats in averaged_data.items():
            avg_roll = stats["average"]
            totals = stats["totals"]
            last_rolls = stats["last_rolls"]
            formatted_last_rolls = ", ".join(map(str, last_rolls))

            if session_date == shared_state.session_date:
                state.average_rolls = f"Roll average: {int(avg_roll)}"
                state.average_rolls += " - - - "
                state.average_rolls += f"Last 10: {formatted_last_rolls}"

        await asyncio.sleep(5)
