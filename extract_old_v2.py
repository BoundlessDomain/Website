
import re

try:
    with open('old_index.py', 'r', encoding='utf-16') as f:
        content = f.read()
        
    match = re.search(r'def process_url\(.*?\):(.*?)(?=\ndef |\Z)', content, re.DOTALL)
    if match:
        print("FOUND process_url:")
        print(match.group(0))
    else:
        print("process_url NOT FOUND")
        
        # Fallback: Print first 100 lines to see what's there
        print("\n--- File Content Start ---")
        print(content[:500])

except Exception as e:
    print(f"Error: {e}")
