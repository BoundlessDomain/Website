
try:
    with open('build_log.txt', 'r', encoding='utf-16-le') as f:
        content = f.read()
        print("--- UTF-16-LE ---")
        print(content[-5000:])
except Exception as e:
    print(f"UTF-16-LE failed: {e}")
    try:
        with open('build_log.txt', 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            print("--- UTF-8 ---")
            print(content[-5000:])
    except Exception as e2:
         print(f"UTF-8 failed: {e2}")
