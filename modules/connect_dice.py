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

    async def connect_die(available_dice, die_id):
        """Connect to a die object and add it to the shared state."""
        try:
            if available_dice.pixel_id == int(die_id, 16):
                state.die_data[die_id] = available_dice.hydrate()
                await state.die_data[die_id].connect()
                state.die_connected = True
                if state.config["DEBUG"]:
                    print(f"Connected to: {state.die_data[die_id].name} ID: {state.die_data[die_id].pixel_id:x}")
            if state.die_data[die_id].name not in dice_state:
                dice_state[state.die_data[die_id].name] = {"prev_state": 0, "current_state": state.die_data[die_id].roll_state}
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
                    current_state = state.die_data[die_value].roll_state
                    prev_state = dice_state[state.die_data[die_value].name]["prev_state"]
                    if state.config["DEBUG_LOOP"]:
                        await asyncio.sleep(1)
                        print(f"Current state: {current_state}")
                        print(f"Previous state: {prev_state}")
                    if prev_state == 3 and current_state == 1:
                        # Checks if the die was recently rolled (3) and has finished rolling (1) before adjusting the roll face.
                        state.latest_roll_face = state.die_data[die_value].roll_face + 1
                        if state.config["DEBUG"]:
                            print(f"{state.die_data[die_value].name} rolled: {state.latest_roll_face}")
                            print(f"Battery: {state.die_data[die_value].batt_level}")
                            print(f"Session Date: {state.session_date}")
                    dice_state[state.die_data[die_value].name]["prev_state"] = current_state
                except Exception:
                    if state.config["DEBUG"]:
                        print("Exception in die loop.")
                        raise


async def show_die_data(state):
    while True:
        await asyncio.sleep(1)
        if state.die_connected:
            print(f"{state.die_data}:")
            for die in state.die_data:
                await asyncio.sleep(1)
                print(f"{die}:")
