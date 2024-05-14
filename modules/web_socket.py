# Standard library imports
import asyncio
import websockets

# import random


# Public library imports
# Personal library imports
# Module imports
# Initialized variables

# Remainder of the code


async def handle_client(websocket, path, state):
    try:
        while True:
            roll = state.die_data["39de7022"]["last_roll"]
            await websocket.send(str(roll))  # Send the roll value as a string
            await asyncio.sleep(1)  # Update every second (adjust as needed)
    except websockets.exceptions.ConnectionClosedOK:
        pass
    except KeyError as e:
        print(e)
    except Exception:
        raise


async def start_server(state):
    start_server = websockets.serve(lambda ws, path: handle_client(ws, path, state), "localhost", 8765)
    await start_server
