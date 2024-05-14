# Standard library imports
import asyncio
import binascii

# Public library imports
from bleak import BleakScanner, BleakClient

# Personal library imports
# Initialized variables.
PIXEL_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
WHO_ARE_YOU_CMD = b"\x01"


# Remainder of the code
class Pixel_Die:
    """Class for a single Pixels die."""

    def __init__(self, id, name, shared_state):
        self.die_id = id
        self.die_name = name
        self.shared_state = shared_state
        self.die_device = None
        self.client = None
        self.die_results = self.shared_state.die_config["DIE_RESULTS"]

    async def send_who_are_you_cmd(self):
        if self.client:
            await self.client.write_gatt_char(PIXEL_UUID, WHO_ARE_YOU_CMD)

    async def notification_handler(self, sender, data):
        if len(data) > 21:
            self.shared_state.die_data[self.die_id]["battery"] = str(data[20])
        decoded_data = binascii.hexlify(data).decode("ascii")
        if decoded_data in self.die_results and decoded_data != "16000a":
            await self.send_who_are_you_cmd()
            result = self.die_results[decoded_data]
            self.shared_state.die_data[self.die_id]["last_roll"] = result
            if self.shared_state.config["DEBUG"]:
                print(self.shared_state.die_data[self.die_id]["battery"])
                print(f"Raw data: {data}")
                print(f"Decoded data: {decoded_data}")

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
            if not self.die_device and self.shared_state.config["DEBUG"]:
                print("Dice not found.")

    async def connect_and_subscribe(self):
        if not self.die_device and self.shared_state.config["DEBUG"]:
            print("No device to connect to")
            return
        async with BleakClient(self.die_device.address) as self.client:
            if self.shared_state.config["DEBUG"]:
                print(f"Connected to {self.die_device.name}")
            self.shared_state.die_data[self.die_id] = {
                "connected_pixel": None,
                "die_name": None,
                "battery": None,
                "session_date": None,
                "time_rolled": None,
                "die_type": None,
                "pixel_id": None,
                "last_roll": 0,
            }
            # Setup notifications
            for service in self.client.services:
                for characteristic in service.characteristics:
                    if "notify" in characteristic.properties:
                        await self.client.start_notify(characteristic.uuid, self.notification_handler)
            if self.shared_state.config["DEBUG"]:
                print("Waiting for notifications...")
            await self.send_who_are_you_cmd()
            await asyncio.sleep(43200)  # Keep the script running to receive notifications

    async def run(self):
        await self.scan_for_device()
        if self.die_device:
            await self.connect_and_subscribe()
