import time
import requests
import os
import argparse

def keep_alive(url: str, interval_minutes: int):
    """
    Pings the health endpoint at the given interval to prevent sleep.
    The /health endpoint has been modified to also query Supabase,
    so hitting it keeps BOTH Render and Supabase active.
    """
    print(f"Starting Keep-Alive script for: {url}")
    print(f"Interval: {interval_minutes} minutes")
    
    interval_seconds = interval_minutes * 60
    
    while True:
        try:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Pinging {url}...")
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success! API Status: {data.get('status')} | DB Status: {data.get('database')}")
            else:
                print(f"⚠️ Warning: Received status code {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error pinging the server: {e}")
            
        print(f"Sleeping for {interval_minutes} minutes...\n")
        time.sleep(interval_seconds)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Keep KodaTrade API & Supabase alive")
    parser.add_argument(
        "--url", 
        type=str, 
        default=os.environ.get("PRODUCTION_API_URL", "http://localhost:8000/api/v1/health"),
        help="The full health endpoint URL to ping"
    )
    parser.add_argument(
        "--interval", 
        type=int, 
        default=14,
        help="Interval in minutes (default 14 to beat Render's 15 min sleep)"
    )
    
    args = parser.parse_args()
    keep_alive(args.url, args.interval)
