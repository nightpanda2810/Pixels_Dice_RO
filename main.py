# Standard library imports
import asyncio
import threading
import time

# Public library imports

# Personal library imports
from pandalibs.yaml_importer import get_configuration_data
from pandalibs.pprint_nosort import pp

# Module imports
from modules.average_rolls import average_mongo_data
from modules.connect_dice import Pixel_Die
from modules.mongodb_atlas import update_mongo_shared_data
from modules.shared_state import SharedState
from modules.web_socket import start_server
from modules.system_tray import start_system_tray

# Initialized variables
shared_state = SharedState()
shared_state.config = get_configuration_data()
shared_state.die_config = get_configuration_data(file_name="die_raw_data.yaml")

# Remainder of the code
# Print current configuration if DEBUG is true.
if shared_state.config["DEBUG"]:
    print("Configuration information.")
    pp(shared_state.config)
    print("End configuration information.\n")


async def connect_to_dice():
    all_dice = []
    if shared_state.config["DEBUG"]:
        print("Configured Dice:")
    for die_id, die_name in shared_state.config["dice"].items():
        if die_name:
            if shared_state.config["DEBUG"]:
                print(f"Name: {die_id} value: {die_name}")
            all_dice.append(Pixel_Die(die_id, die_name, shared_state))
    for die in all_dice:
        await die.run()


# Main event loop function.
async def main():
    """Main event loop."""
    tasks = [
        start_server(shared_state),
        connect_to_dice(),
    ]

    if shared_state.config["enable_database"]:
        tasks.extend(
            [
                update_mongo_shared_data(shared_state),
                average_mongo_data(shared_state),
            ]
        )

    await asyncio.gather(*tasks)


# Run the main event loop in a separate thread.
def start_main_event_loop():
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        if shared_state.config["DEBUG"]:
            print("Exiting program via Keyboard Interrupt.")


if __name__ == "__main__":
    # Start the system tray icon
    tray_thread = threading.Thread(target=start_system_tray)
    tray_thread.start()

    # Start the main event loop
    main_thread = threading.Thread(target=start_main_event_loop)
    main_thread.start()

    # Keep the script running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        if shared_state.config["DEBUG"]:
            print("Exiting program via Keyboard Interrupt.")
