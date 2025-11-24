import requests
import time


LEADER = "http://localhost:5000"
FOLLOWERS = [
    "http://localhost:5001",
    "http://localhost:5002",
    "http://localhost:5003",
    "http://localhost:5004",
    "http://localhost:5005",
]


def test():

    key = "1"
    value = "first_value"

    r = requests.post(f"{LEADER}/write", json={"key": key, "value": value})   

    assert r.status_code == 200, "Leader did not accept the write!"

    time.sleep(0.5)

    store = requests.get(f"{LEADER}/read?key={key}")
    assert store.status_code == 200
    assert store.json()["value"] == value, "Leader does not have the correct value!"



    for f in FOLLOWERS:
        fr = requests.get(f"{f}/read?key={key}")
        assert fr.status_code == 200
        print(fr.json())
        assert fr.json()["value"] == value, f"Follower {f} does NOT have replicated data!"

    print("Replication integration test passed successfully!")
    


if __name__ == "__main__":
    test()


