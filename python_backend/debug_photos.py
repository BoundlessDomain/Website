
import main
import traceback

try:
    print("Attempting to run get_photos()...")
    result = main.get_photos()
    print("Success!")
    # print(result)
except Exception:
    print("Crashed!")
    traceback.print_exc()
