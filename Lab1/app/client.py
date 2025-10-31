from socket import *
import sys, os

serverName = sys.argv[1]      # server_host
serverPort = int(sys.argv[2]) # server_port
url_path = sys.argv[3]        
save_dir = sys.argv[4]        


def run_client():

    clientSocket = socket(AF_INET, SOCK_STREAM)
    clientSocket.connect((serverName, serverPort))

    request_line = f"GET {url_path} HTTP/1.1\r\n\r\n"
    clientSocket.send(request_line.encode())


    response = b""
    while True:
        data = clientSocket.recv(1024)
        if not data:
            break
        response += data

    response_headers = response.split(b"\r\n\r\n")[0].decode()
    body = response.split(b"\r\n\r\n", 1)[1]
    
    if "Content-Type: text/html" in response_headers:
        print(body.decode())
        print("HTML content received, not saving to file.")
    else:
        os.makedirs(save_dir, exist_ok=True)  # make sure directory exists
        fileName = os.path.join(save_dir, os.path.basename(url_path))
        with open(fileName, 'wb') as f:
            f.write(body)
        print(f"File saved to {fileName}")

    clientSocket.close()

if __name__ == "__main__":
    run_client()
