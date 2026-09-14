import os
import sys
import zipfile

# Ensure UTF-8 output
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SOURCE_DIR = r"C:\Users\OM SHUKLA\.gemini\antigravity\scratch\military-box-backend"
ZIP_OUTPUT = r"C:\Users\OM SHUKLA\.gemini\antigravity\brain\034b20c5-55e4-4dc5-8500-73c2a84ca85b\military-box-backend-complete.zip"

def package_project():
    print(f"Packaging project from {SOURCE_DIR} into {ZIP_OUTPUT}...")
    
    with zipfile.ZipFile(ZIP_OUTPUT, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(SOURCE_DIR):
            if 'venv' in root or '__pycache__' in root:
                continue
            for file in files:
                if file.endswith('.zip'):
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, SOURCE_DIR)
                zipf.write(file_path, arcname)
                print(f"  + Added: {arcname}")

    print(f"Package created successfully! File size: {os.path.getsize(ZIP_OUTPUT)} bytes")

if __name__ == "__main__":
    package_project()
