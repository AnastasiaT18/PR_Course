import threading
import subprocess
import time

# files = ["/filepractica.pdf", "/image1.png", "/index.html", "/contents_subfolder/dogphoto.png", "/contents_subfolder/GuidebookPoznan.pdf"] * 2
file = "/filepractica.pdf"
threads = []
results = {"ok": 0, "429": 0}  

def request_file(file):
    completed = subprocess.run(["python", "client.py", "localhost", "8080", file, "./downloads"], capture_output=True, text=True)
    output = completed.stdout.strip()   

    if "200" in output or "File saved to" in output:
        results["ok"] += 1
    elif "429" in output:
        results["429"] += 1


start = time.time()

for i in range(10):
    t = threading.Thread(target=request_file, args=(file,))
    threads.append(t)
    t.start()
    # request_file(file)

for t in threads:
    t.join()

end = time.time()
time_total = end - start

print(f"Total time for 10 concurrent requests: {time_total:.2f} seconds")
print(f"Successful (200) OK results: {results['ok']}")
print(f"Unsuccessful (429) results: {results['429']}")
print(f"Throughput (successful requests/sec): {results['ok'] / time_total:.2f}")






