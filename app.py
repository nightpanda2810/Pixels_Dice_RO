# Standard library imports
import asyncio

# Public library imports

# Personal library imports
from pandalibs.yaml_importer import get_configuration_data
from pandalibs.pprint_nosort import pp


# Module imports
from modules.connect_dice import find_and_connect_to_dice
from modules.shared_state import SharedState
from modules.web_socket import start_server

# Initialized variables
shared_state = SharedState()
shared_state.config = get_configuration_data()

# Remainder of the code
# Print current configuration if DEBUG is true.
if shared_state.config["DEBUG"]:
    print("Configuration information.")
    pp(shared_state.config)
    print("End configuration information.\n")


# Main event loop function.
async def main():
    """Main event loop."""
    await asyncio.gather(
        find_and_connect_to_dice(shared_state),
        start_server(shared_state),
    )


# Run the main event loop.
try:
    asyncio.run(main())
except KeyboardInterrupt:
    if shared_state.config["DEBUG"]:
        print("Exiting program via Keyboard Interrupt.")
