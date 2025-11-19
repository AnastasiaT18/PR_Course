from flask import Flask, jsonify, request
import os

app = Flask(__name__)
store = {}


@app.route("/ping")
def ping():
    follower_id = os.getenv("FOLLOWER_ID", "unknown")
    return jsonify({"role": "follower", "id": follower_id, "status": "ok"})


@app.route("/replicate", methods=["POST"])
def replicate():
    data = request.get_json()
    key = data["key"]
    value = data["value"]
    store[key] = value

    return jsonify({"status": "ok"})



@app.route("/read", methods=["GET"])
def read():
    key = request.args.get('key')
    value = store.get(key)
    return jsonify({"key": key, "value": value})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
