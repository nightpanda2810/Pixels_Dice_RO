"""Module to connect to Pixels dice."""

# Standard library imports
import asyncio
import binascii
import time

# Public library imports
import bleak

# Personal library imports
# Module Imports
from modules.mongodb_atlas import upload_die_result
from modules.sound_effects import play_sound

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
        """Sends a request to the die to return MISC data."""
        if self.client:
            await self.client.write_gatt_char(PIXEL_UUID, WHO_ARE_YOU_CMD)

    async def notification_handler(self, sender, data):
        """Loop to handle notifications from the die."""
        if len(data) > 21:
            # Convert battery percentage bytes to readable string.
            self.shared_state.die_data[self.die_id]["battery"] = str(data[20])
            self.shared_state.die_data[self.die_id]["die_type"] = "D" + str(data[1])
            self.shared_state.die_data[self.die_id]["session_date"] = self.shared_state.session_date
            # Convert Pixel ID bytes to readable string and place in correct order to match what shows in official Pixels app.
            pixel_id_bytes = data[8:12][::-1]
            pixel_id = "".join(f"{byte:02x}" for byte in pixel_id_bytes)
            self.shared_state.die_data[self.die_id]["pixel_id"] = pixel_id
        # Convert raw byte data into HEX, and if it matches the results dictionary, update the die data.
        decoded_data = binascii.hexlify(data).decode("ascii")
        if decoded_data in self.die_results and decoded_data != "16000a":
            self.shared_state.die_data[self.die_id]["time_rolled"] = time.strftime("%H:%M:%S", time.localtime())
            await self.send_who_are_you_cmd()
            result = self.die_results[decoded_data]
            self.shared_state.die_data[self.die_id]["last_roll"] = result
            if self.shared_state.config["enable_database"]:
                upload_die_result(self.shared_state, self.shared_state.config["mongodb_atlas_uri"], self.shared_state.die_data[self.die_id])
            if self.shared_state.config["enable_audio"]:
                play_sound(result)
            # Printouts for debugging.
            if self.shared_state.config["DEBUG"]:
                self.notification_debug_print(data, decoded_data)

    async def scan_for_device(self):
        """Scans for available devices and connects to each configured die."""
        die_connected = False
        while not die_connected:
            if self.shared_state.config["DEBUG"]:
                print(f"Scanning for {self.die_name} ID: {self.die_id}")
            devices = await bleak.BleakScanner.discover()
            for device in devices:
                if device.name == self.die_name:
                    self.die_device = device
                    die_connected = True
                    break

            if not self.die_device and self.shared_state.config["DEBUG"]:
                print(f"{self.die_name} ID: {self.die_id} not found.")

    async def connect_and_subscribe(self):
        """Setup die connection and begin loops."""
        if not self.die_device:
            # Printouts for debugging.
            if self.shared_state.config["DEBUG"]:
                print("No device to connect to.")
            return

        async with bleak.BleakClient(self.die_device.address) as self.client:
            # Printouts for debugging.
            if self.shared_state.config["DEBUG"]:
                print(f"Connected to {self.die_device.name} ID: {self.die_id}.")
            self._initialize_die_data()
            await self._setup_notifications()
            # Printouts for debugging.
            if self.shared_state.config["DEBUG"]:
                print(f"Waiting for notifications from {self.die_device.name} ID: {self.die_id}.")
            await self.send_who_are_you_cmd()
            # Keep the script running to receive notifications
            await asyncio.sleep(43200)

    async def run(self):
        """Starts everything."""
        await self.scan_for_device()
        if self.die_device:
            await self.connect_and_subscribe()

    def _initialize_die_data(self):
        """Initialize blank data for the die."""
        self.shared_state.die_data[self.die_id] = {
            "connected_pixel": None,
            "die_name": self.die_name,
            "battery": None,
            "session_date": None,
            "time_rolled": None,
            "die_type": None,
            "pixel_id": None,
            "last_roll": 0,
        }

    async def _setup_notifications(self):
        """Sets up notification loop."""
        for service in self.client.services:
            for characteristic in service.characteristics:
                if "notify" in characteristic.properties:
                    await self.client.start_notify(characteristic.uuid, self.notification_handler)

    def notification_debug_print(self, data, decoded_data):
        """Prints out the notification data for debugging."""
        print(f"Result: {self.shared_state.die_data[self.die_id]['last_roll']}")
        print(f"Battery: {self.shared_state.die_data[self.die_id]['battery']} %")
        print(f"Pixel ID: {self.shared_state.die_data[self.die_id]['pixel_id']}")
        print(f"Raw data: {data}")
        print(f"Decoded data: {decoded_data}")
