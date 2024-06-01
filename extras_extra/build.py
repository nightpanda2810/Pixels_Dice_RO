# Without terminal window.
# nuitka --standalone --onefile --windows-disable-console --windows-icon-from-ico=./extras/logo.ico --plugin-enable=pylint-warnings --include-module=bleak --include-module=websockets.legacy --include-module=websockets.legacy.server --include-data-dir=./extras=./extras .\main.py

# With terminal window.
# nuitka --standalone --onefile --windows-icon-from-ico=./extras/logo.ico --plugin-enable=pylint-warnings --include-module=bleak --include-module=websockets.legacy --include-module=websockets.legacy.server --include-data-dir=./extras=./extras .\main.py

import subprocess
import sys
import shutil
import os


def compile_with_nuitka():
    command = (
        "nuitka "
        "--standalone "
        "--onefile "
        "--windows-disable-console "
        "--windows-icon-from-ico=./extras/logo.ico "
        "--plugin-enable=pylint-warnings "
        "--include-module=bleak "
        "--include-module=websockets.legacy "
        "--include-module=websockets.legacy.server "
        "--include-data-dir=./extras=./extras "
        "./main.py"
    )

    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, shell=True)

    try:
        while True:
            output = process.stdout.readline()
            if output == "" and process.poll() is not None:
                break
            if output:
                print(output.strip())
                sys.stdout.flush()

        stderr_output = process.communicate()[1]
        if stderr_output:
            print(stderr_output, end="")
            sys.stdout.flush()

        if process.returncode != 0:
            raise subprocess.CalledProcessError(process.returncode, command)

    except subprocess.CalledProcessError:
        print("Compilation failed:")
        sys.exit(1)

    # Clean up build directories
    directories_to_delete = ["main.build", "main.dist", "main.onefile-build"]
    for directory in directories_to_delete:
        if os.path.exists(directory):
            shutil.rmtree(directory)
            print(f"Deleted directory: {directory}")


if __name__ == "__main__":
    compile_with_nuitka()
