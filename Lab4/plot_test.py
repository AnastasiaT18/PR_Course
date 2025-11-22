import subprocess
import threading
import time
import requests
import matplotlib.pyplot as plt


import requests


THREADS = 15
WRITES = 10000
KEYS = 100

LEADER = "http://localhost:5000"
FOLLOWERS = [
    "http://localhost:5001",
    "http://localhost:5002",
    "http://localhost:5003",
    "http://localhost:5004",
    "http://localhost:5005",
]

threads = []
latencies = []
latencies_lock = threading.Lock()

def run(quorum):

    writes_per_thread = WRITES // THREADS

    latencies.clear()
    threads.clear()

    for i in range(THREADS):
        t = threading.Thread(target=write_1000, args=(writes_per_thread, quorum))
        # print("Thread {i} started for QUORUM={quorum}".format(i=i, quorum=quorum), flush=True)
        t.start()
        threads.append(t)

    for t in threads:
        t.join()


    avg_latency = sum(latencies) / len(latencies)
    return avg_latency



def write_one(key, value, quorum):
    start_time = time.time()
    r = requests.post(f"{LEADER}/write", json={"key": key, "value": value, "quorum": quorum})   
    end_time = time.time()
    latency = end_time - start_time

    with latencies_lock:
        latencies.append(latency)


def write_1000(writes_per_thread, quorum):
    for i in range(writes_per_thread):
        key = str(i % KEYS)
        write_one(key, key, quorum)



def main():
    quorum = 5
    avg_latencies = []

    for q in range(quorum):

        print(f"Running test with QUORUM={q+1}", flush=True)
        avg_latencies.append(run(q+1))




    plt.plot(range(1, quorum+1), avg_latencies, marker='o')
    plt.xlabel("WRITE_QUORUM")
    plt.ylabel("Average Write Latency (s)")
    plt.title("Write Quorum vs Average Latency")
    plt.grid(True)
    plt.savefig("plot.png")   # saves to file instead
    plt.close()    
    check_replications()
    print(avg_latencies)




def check_replications():

    leader = {}
    per_follower_matches = {f: 0 for f in FOLLOWERS}
   

    for key in range(KEYS):
        r = requests.get(f"{LEADER}/read?key={key}")
        leader[str(key)] = r.json()["value"]

    for key in range(KEYS):
        for f in FOLLOWERS:
            fr = requests.get(f"{f}/read?key={key}")
            if fr.json()["value"] == leader[str(key)]:
                per_follower_matches[f] += 1
    
    print("\n=== Consistency Check Results ===")
    print("Keys:", KEYS)
    for f in FOLLOWERS:
        print("Follower", f, " matched keys: ", per_follower_matches[f], "/", KEYS)
            


if __name__ == "__main__":
    main()