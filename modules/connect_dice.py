# Standard library imports
import asyncio
import binascii

# Public library imports
from bleak import BleakScanner, BleakClient

# Personal library imports
# Initialized variables
PIXEL_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
WHO_ARE_YOU_CMD = b"\x01"


class Pixel_Die:
    """Class for a single Pixel die."""

    def __init__(self, die_id, name, shared_state):
        self.die_id = die_id
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
            pixel_id_bytes = data[8:12][::-1]
            pixel_id = "".join(f"{byte:02x}" for byte in pixel_id_bytes)
            self.shared_state.die_data[self.die_id]["pixel_id"] = pixel_id

        decoded_data = binascii.hexlify(data).decode("ascii")
        if decoded_data in self.die_results and decoded_data != "16000a":
            await self.send_who_are_you_cmd()
            result = self.die_results[decoded_data]
            self.shared_state.die_data[self.die_id]["last_roll"] = result

            if self.shared_state.config["DEBUG"]:
                self._debug_print(data, decoded_data)

    async def scan_for_device(self):
        die_connected = False
        while not die_connected:
            print(f"Scanning for {self.die_name} ID: {self.die_id}")
            devices = await BleakScanner.discover()
            for device in devices:
                if device.name == self.die_name:
                    self.die_device = device
                    die_connected = True
                    break

            if not self.die_device and self.shared_state.config["DEBUG"]:
                print(f"{self.die_name} ID: {self.die_id} not found.")

    async def connect_and_subscribe(self):
        if not self.die_device:
            if self.shared_state.config["DEBUG"]:
                print("No device to connect to.")
            return

        async with BleakClient(self.die_device.address) as self.client:
            if self.shared_state.config["DEBUG"]:
                print(f"Connected to {self.die_device.name} ID: {self.die_id}.")

            self._initialize_die_data()
            await self._setup_notifications()
            if self.shared_state.config["DEBUG"]:
                print(f"Waiting for notifications from {self.die_device.name} ID: {self.die_id}.")
            await self.send_who_are_you_cmd()
            await asyncio.sleep(43200)  # Keep the script running to receive notifications

    async def run(self):
        await self.scan_for_device()
        if self.die_device:
            await self.connect_and_subscribe()

    def _initialize_die_data(self):
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

    async def _setup_notifications(self):
        for service in self.client.services:
            for characteristic in service.characteristics:
                if "notify" in characteristic.properties:
                    await self.client.start_notify(characteristic.uuid, self.notification_handler)

    def _debug_print(self, data, decoded_data):
        print(f"Result: {self.shared_state.die_data[self.die_id]['last_roll']}")
        print(f"Battery: {self.shared_state.die_data[self.die_id]['battery']} %")
        print(f"Pixel ID: {self.shared_state.die_data[self.die_id]['pixel_id']}")
        print(f"Raw data: {data}")
        print(f"Decoded data: {decoded_data}")
