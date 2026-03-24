"""
Tests the CSV upload route against the running Docker stack.
Run from project root:
    python test_categoriser.py
"""
import io
import time
import httpx
import pandas as pd

BASE_URL = "http://localhost:8000"
CSV_PATH = "app/tasks/activity-7.csv"
SAMPLE_SIZE = 5


def main():
    df = pd.read_csv(CSV_PATH).head(SAMPLE_SIZE)
    csv_bytes = df.to_csv(index=False).encode()

    print(f"Uploading {SAMPLE_SIZE} rows...")
    with httpx.Client(timeout=30) as client:
        # Upload
        t0 = time.perf_counter()
        response = client.post(
            f"{BASE_URL}/transactions/upload-csv",
            files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        response.raise_for_status()
        group_id = response.json()["group_id"]
        print(f"Queued — task_id: {group_id}")

        # Poll for result
        while True:
            time.sleep(2)
            status_response = client.get(f"{BASE_URL}/transactions/upload-csv/{group_id}")
            data = status_response.json()
            status = data["status"]
            elapsed = time.perf_counter() - t0
            print(f"  [{elapsed:.1f}s] {status}")

            if status == "complete":
                print(f"\nDone in {elapsed:.1f}s")
                print(f"  Transactions status       : {data['status']}")
                print(f"  Transactions id : {data['group_id']}")
                break
            elif status == "failed":
                print(f"Failed: {data.get('error')}")
                break


main()