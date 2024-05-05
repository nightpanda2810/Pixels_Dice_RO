# Standard library imports
import asyncio
import time

# Public library imports
from nat20 import scan_for_dice

# Personal library imports
# Module imports
# Initialized variables


# Remainder of the code
async def find_and_connect_to_dice(state):
    """Find and connect to all dice objects, and connect to those specified in configuration file."""
    dice_state = {}

    async def connect_die(available_die, die_id):
        """Connect to a die object and add it to the shared state."""
        try:
            if available_die.pixel_id == int(die_id, 16):
                state.die_data[die_id] = {
                    "connected_pixel": available_die.hydrate(),
                    "battery": available_die.batt_level,
                    "session_date": state.session_date,
                    "die_type": f"D{available_die.face_count}",
                    "last_roll": 0,
                }
                await state.die_data[die_id]["connected_pixel"].connect()
                state.die_connected = True
                if state.config["DEBUG"]:
                    print(f"Connected to: {state.die_data[die_id]['connected_pixel'].name} ID: {state.die_data[die_id]['connected_pixel'].pixel_id:x}")
            if state.die_data[die_id]["connected_pixel"].name not in dice_state:
                dice_state[state.die_data[die_id]["connected_pixel"].name] = {"prev_state": 0, "current_state": state.die_data[die_id]["connected_pixel"].roll_state}
            else:
                if state.config["DEBUG"]:
                    current_time = time.strftineme("%H:%M:%S")
                    print(f"Didn't connect. {current_time}")
        except Exception:
            if state.config["DEBUG"]:
                print("Exception in connect_die.")
                raise
            raise

    async for available_dice in scan_for_dice():
        if state.config["DEBUG"]:
            print(f"Found die - Name: {available_dice.name} ID: {available_dice.pixel_id:x}")
        # This will need refactored for multiple dice. Needs the while loop up here.
        for die_name, die_value in state.config["dice"].items():
            if state.config["DEBUG"]:
                print(f"Attempting to connect to {die_name} ID: {die_value}...")
            if die_value:
                await connect_die(available_dice, die_value)
            while True:
                try:
                    await asyncio.sleep(0.1)
                    if state.config["DEBUG_LOOP"]:
                        print("Entering loop.")
                    current_state = state.die_data[die_value]["connected_pixel"].roll_state
                    prev_state = dice_state[state.die_data[die_value]["connected_pixel"].name]["prev_state"]
                    if state.config["DEBUG_LOOP"]:
                        await asyncio.sleep(1)
                        print(f"Current state: {current_state}")
                        print(f"Previous state: {prev_state}")
                    if prev_state == 3 and current_state == 1:
                        # Checks if the die was recently rolled (3) and has finished rolling (1) before adjusting the roll face.
                        state.die_data[die_value]["last_roll"] = state.die_data[die_value]["connected_pixel"].roll_face + 1
                        if state.config["DEBUG"]:
                            print(f"{state.die_data[die_value]['connected_pixel'].name} rolled: {state.die_data[die_value]['last_roll']}")
                            print(f"Battery: {state.die_data[die_value]['connected_pixel'].batt_level}")
                            print(f"session_date: {state.session_date}")
                    dice_state[state.die_data[die_value]["connected_pixel"].name]["prev_state"] = current_state
                except Exception:
                    if state.config["DEBUG"]:
                        print("Exception in die loop.")
                        raise


async def show_die_data(state):
    while True:
        await asyncio.sleep(1)
        if state.die_connected:
            print(f"{state.die_data}")
            # for key, value in state.die_data.items():
            #     await asyncio.sleep(1)
            #     print(f"Key: {key}, Value: {value}")
            #     for key, value in value.items():
            #         await asyncio.sleep(1)
            #         print(f"Key: {key}, Value: {value}")
