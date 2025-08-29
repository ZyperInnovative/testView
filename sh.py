import hashlib
import time

def generate_code():
    while True:
        # Get current timestamp
        timestamp = str(time.time()).encode()
        
        # Hash the timestamp using SHA-256
        hash_obj = hashlib.sha256(timestamp)
        hex_digest = hash_obj.hexdigest()  # 64-character hex string
        
        # Take first 50 characters of the hash
        code = hex_digest[:50]
        
        # Print timestamp and code
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Generated Code: {code}")
        
        # Wait 30 seconds
        time.sleep(30)

if __name__ == "__main__":
    try:
        generate_code()
    except KeyboardInterrupt:
        print("\nExiting...")
