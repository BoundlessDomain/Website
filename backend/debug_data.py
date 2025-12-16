
import main
import json

try:
    data = main.get_photos()
    print(json.dumps(data, indent=2))
except Exception as e:
    print(e)
