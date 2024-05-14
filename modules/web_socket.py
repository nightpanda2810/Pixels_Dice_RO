# Standard library imports
import asyncio
import websockets
import json

# import random


# Public library imports
# Personal library imports
# Module imports
# Initialized variables

# Remainder of the code


async def handle_client(websocket, path, state):
    try:
        while True:
            for die_id, die_name in state.config["dice"].items():
                if die_name:
                    roll = state.die_data[die_id]["last_roll"]
                    average = state.average_rolls
                    data = {
                        "roll": roll,
                        "average": average,
                    }
                    await websocket.send(json.dumps(data))  # Send the roll value as a string
                    await asyncio.sleep(1)  # Update every second (adjust as needed)
    except websockets.exceptions.ConnectionClosedOK:
        pass
    except KeyError:
        pass
    except Exception:
        raise


async def start_server(state):
    start_server = websockets.serve(lambda ws, path: handle_client(ws, path, state), "localhost", 8765)
    await start_server
