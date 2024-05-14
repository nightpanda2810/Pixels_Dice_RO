# Standard library imports
import asyncio
import binascii

# Public library imports
from bleak import BleakScanner, BleakClient

# Personal library imports
from pandalibs.yaml_importer import get_configuration_data
from pandalibs.pprint_nosort import pp

DICE_NAME = "Aurora"  # Replace with your dice device name

CONFIG = get_configuration_data()
DIE_CONFIG = get_configuration_data(file_name="die_raw_data.yaml")
DIE_RESULTS = DIE_CONFIG["DIE_RESULTS"]


class Pixel_Die:
    """Class for a single die."""

    def __init__(self, name, shared_state):
        self.die_name = name
        self.shared_state = shared_state
        self.die_device = None
        self.client = None

    def notification_handler(self, sender, data):
        new_data = binascii.hexlify(data)
        decoded_data = new_data.decode("ascii")
        if decoded_data in DIE_RESULTS and decoded_data != "16000a":
            result = DIE_RESULTS[decoded_data]
            self.shared_state.die_data["39de7022"]["last_roll"] = result

    async def scan_for_device(self):
        die_connected = False
        while not die_connected:
            print("Scanning for devices...")
            devices = await BleakScanner.discover()
            for device in devices:
                if device.name == self.die_name:
                    self.die_device = device
                    die_connected = True
                    break
            if not self.die_device:
                print("Dice not found.")

    async def connect_and_subscribe(self):
        if not self.die_device:
            print("No device to connect to")
            return
        async with BleakClient(self.die_device.address) as self.client:
            print(f"Connected to {self.die_device.name}")
            self.shared_state.die_data["39de7022"] = {
                "connected_pixel": True,
                "die_name": True,
                "battery": True,
                "session_date": True,
                "time_rolled": True,
                "die_type": True,
                "last_roll": 0,
            }
            # Subscribe to notifications
            for service in self.client.services:
                for characteristic in service.characteristics:
                    if "notify" in characteristic.properties:
                        await self.client.start_notify(characteristic.uuid, self.notification_handler)
            # Keep the script running to receive notifications
            print("Waiting for notifications...")
            await asyncio.sleep(43200)  # Adjust the sleep time as needed

    async def run(self):
        await self.scan_for_device()
        if self.die_device:
            await self.connect_and_subscribe()


async def connect_to_dice(state):
    for die_id, die_name in state.config["dice"].items():
        print("Available Dice:")
        if die_name:
            print(f"Name: {die_id} value: {die_name}")
            die = Pixel_Die(die_name, state)
            await die.run()
