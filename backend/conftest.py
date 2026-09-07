import os
import sys
import pathlib

# Cross-platform compatibility for unpickling models serialized across OS environments (Windows <-> Linux/macOS)
if os.name != "nt":
    pathlib.WindowsPath = pathlib.PosixPath
else:
    pathlib.PosixPath = pathlib.WindowsPath

# Add backend directory to sys.path so 'app' module is always discoverable
backend_dir = pathlib.Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
