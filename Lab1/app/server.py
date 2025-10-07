from socket import *
import os, sys

content_types = {
    ".html": "text/html",
    ".png": "image/png",
    ".pdf": "application/pdf"
}

def start_server():
    content_dir = sys.argv[1]

    serverPort = 8080

    serverSocket = socket(AF_INET, SOCK_STREAM)
    serverSocket.bind(('', serverPort))
    serverSocket.listen(1)
    print(f"Server listening on http://localhost:{serverPort}")

    while True:
        connectionSocket, adr = serverSocket.accept()
        print(f"Connection from {adr}")
        data = connectionSocket.recv(1024).decode()

        request = data.split("\r\n")[0]
        requested_file = request.split(" ")[1]
        requested_file_path = os.path.join(content_dir, requested_file[1:])

        ext = os.path.splitext(requested_file_path)[1]
        
        content_type = content_types.get(ext, None)


        print(f"Requested file: {requested_file_path}")

        if os.path.isfile(requested_file_path):
            if content_type is None:
                
                response = (
                    "HTTP/1.1 415 Unsupported Media Type\r\n"
                    f"Content-Type: text/html\r\n"
                    "\r\n"
                    "<html><body><h1>415 Unsupported Media Type</h1></body></html>"
                    )
                connectionSocket.sendall(response.encode())

            else:
                mode = 'rb' if ext in ['.png', '.pdf'] else 'r'
                with open(requested_file_path, mode) as f:
                    body = f.read()

                response_headers = (
                    "HTTP/1.1 200 OK\r\n"
                    f"Content-Type: {content_type}\r\n"
                    f"Content-Length: {len(body)}\r\n"
                    "\r\n"
                )
                
                connectionSocket.sendall(response_headers.encode())

                if mode == "rb":
                    connectionSocket.sendall(body)  # body is bytes
                else:
                    connectionSocket.sendall(body.encode())  # body is str
               
        else:
            response = (
                "HTTP/1.1 404 Not Found\r\n"
                f"Content-Type: text/html\r\n"
                "\r\n"
                "<html><body><h1>404 Not Found</h1></body></html>"
            )
            connectionSocket.sendall(response.encode())

        connectionSocket.close()
          
        

if __name__ == "__main__":
    start_server()