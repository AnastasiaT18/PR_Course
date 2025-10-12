import threading
import subprocess
import time

def request_file(file):
    subprocess.run(["python", "client.py", "localhost", "8080", file, "./downloads"])


files = ["/filepractica.pdf", "/image1.png", "/index.html", "/contents_subfolder/dogphoto.png", "/contents_subfolder/GuidebookPoznan.pdf"] * 6
threads = []

start = time.time()

for file in files:
    t = threading.Thread(target=request_file, args=(file,))
    threads.append(t)
    t.start()
    # request_file(file)

for t in threads:
    t.join()

end = time.time()

print(f"Total time for 10 concurrent requests: {end - start:.2f} seconds")



