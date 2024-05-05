import datetime


class SharedState:
    """Test."""

    def __init__(self):
        super().__init__()
        # Playwright
        self.login_event = None
        self.page = None
        self.browser = None

        # Config
        self.config = None

        # Pixels
        self.die_data = {}
        self.dice_reading_thread = None
        self.die_name = "Not Connected"
        self.die_connected = False
        self.die_battery = ""
        self.latest_roll_face = 0
        self.latest_rolls = ""

        # MISC
        self.session_date = datetime.date.today().strftime("%b %d, %Y")
