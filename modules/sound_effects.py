import vlc
import random
from pandalibs.yaml_importer import get_configuration_data

# import variables.sounds as sounds
import os
import sys


# Import sounds
def get_application_path():
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.abspath(sys.argv[0]))


def play_sound(die_roll):
    try:
        sound_import = get_configuration_data()
        bad_sounds = sound_import["bad_sounds"]
        good_sounds = sound_import["good_sounds"]
        any_sounds = sound_import["any_sounds"]
        if not sound_import["enable_audio"]:
            return
        if die_roll == 1:
            url = random.choice(bad_sounds)
        elif die_roll == 20:
            url = random.choice(good_sounds)
        else:
            if sound_import["enable_any_sounds"]:
                url = random.choice(any_sounds)
            else:
                url = None
            pass
        if url:
            vlc.MediaPlayer(url).play()
    except Exception as e:
        print(f"There was an error in sound_effects.play_sound: {e}")
