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
        self.die_connected = False
        self.die_config = {}

        # MISC
        self.session_date = datetime.date.today().strftime("%b %d, %Y")

        # Database
        self.mongo_data = {}
        self.average_rolls = ""
