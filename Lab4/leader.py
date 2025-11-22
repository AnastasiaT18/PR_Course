import random
import time
from flask import Flask, jsonify, request
import os
import requests
import threading

app = Flask(__name__)
store = {}
lock = threading.Lock()



FOLLOWERS = os.getenv("FOLLOWERS", "").split(",")
DEFAULT_QUORUM = os.getenv("WRITE_QUORUM", "1")
MIN_DELAY = float(os.getenv("MIN_DELAY", "0"))
MAX_DELAY = float(os.getenv("MAX_DELAY", "0"))

@app.route("/ping")
def ping():
    return jsonify({"role": "leader", "status": "ok"})


@app.route("/write", methods=["POST"])
def write():

    threads = []
    results = []


    data = request.get_json()
    key = data["key"]
    value = data["value"]
    quorum = data.get("quorum", DEFAULT_QUORUM)

    store[key] = value

    for follower in FOLLOWERS:
        t = threading.Thread(target=replicate_to_follower, args=(follower, key, value, results))
        t.start()
        threads.append(t)

    # for t in threads:
    #     t.join()
     # semi-sync wait with timeout

    start_time = time.time()
    
    timeout = 2  # seconds
    while True:
        success = sum(1 for r in results if r)
        # print("Current success count:", success, flush=True)
        # print(int(quorum), flush=True)
        if success >= int(quorum):
            print("Quorum reached", flush=True)
            break
        if time.time() - start_time > timeout:
            return jsonify({"status": "failed", "success": success}), 500
        # time.sleep(0.001)

    # print(results, success, store, flush=True)
    return jsonify({"status": "ok", "success": success}), 200

    
    


def replicate_to_follower(follower, key, value, results):
    delay = random.uniform(MIN_DELAY, MAX_DELAY)
    time.sleep(delay)
    
    try:
        r = requests.post(f"http://{follower}/replicate", json={"key": key, "value": value})   
        with lock:
            results.append(r.status_code == 200)
    except:
        with lock:
            results.append(False)

@app.route("/read", methods=["GET"])
def read():
    key = request.args.get('key')
    value = store.get(key)
    return jsonify({"key": key, "value": value})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)


