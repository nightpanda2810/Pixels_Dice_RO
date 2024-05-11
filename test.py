import asyncio
import websockets
import random


async def handle_client(websocket, path):
    while True:
        roll = random.randint(1, 20)
        print(roll)
        await websocket.send(str(roll))  # Send the roll value as a string
        await asyncio.sleep(1)  # Update every second (adjust as needed)


start_server = websockets.serve(handle_client, "localhost", 8765)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
