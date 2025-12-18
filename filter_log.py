
import re

try:
    with open('build_log.txt', 'rb') as f:
        data = f.read()
        # Decode as UTF-16LE which works for PowerShell > file
        try:
            text = data.decode('utf-16-le')
        except:
            text = data.decode('utf-8', errors='ignore')
            
    print("- LOG START -")
    for line in text.splitlines():
        if 'Error' in line or 'ERR' in line or 'Failed' in line or 'Trace' in line:
            print(line.strip())
    print("- LOG END -")

except Exception as e:
    print(f"Failed: {e}")
