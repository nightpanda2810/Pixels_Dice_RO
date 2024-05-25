# Standard library imports
import threading
import os
import sys

# Third-party imports
from pystray import Icon, Menu, MenuItem
from PIL import Image

# Personal library imports

# Module imports


def load_icon():
    # Load the icon from extras/logo.ico
    icon_path = os.path.join(os.path.dirname(sys.executable), "extras", "logo.ico")
    if not os.path.exists(icon_path):
        icon_path = "extras/logo.ico"
    return Image.open(icon_path)


def on_clicked(icon, item):
    icon.stop()
    os._exit(0)


def system_tray():
    icon = Icon("nightpanda_logo")
    icon.icon = load_icon()
    icon.title = "Pixels HLO Integration"
    icon.menu = Menu(MenuItem("Quit", on_clicked))
    icon.run()


def start_system_tray():
    tray_thread = threading.Thread(target=system_tray)
    tray_thread.start()
