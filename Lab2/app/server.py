from socket import *
import os, sys
import threading
import time

content_types = {
    ".html": "text/html",
    ".png": "image/png",
    ".pdf": "application/pdf"
}


def handle_request(connectionSocket, adr, content_dir):
    print(f"Connection from {adr}")

    time.sleep(1)  # Simulate a delay for testing concurrency

    data = connectionSocket.recv(1024).decode()

    request = data.split("\r\n")[0]

    parts = request.split(" ")
    if len(parts) < 2:
        connectionSocket.close()  # skip invalid or empty requests
    requested_file = parts[1]
        
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

    elif os.path.isdir(requested_file_path):
        contents = os.listdir(requested_file_path)
        items_html = ""
        for item in contents:
            if requested_file == "/":
                link_path = f"/{item}"
            else:
                link_path = f"{requested_file}/{item}"
            items_html += f'<li><a href="{link_path}">{item}</a></li>'

        response_body = f"""
            <html>
            <body>
                <h1>Directory listing for {requested_file}</h1>
                <ul>
                {items_html}
                </ul>
            </body>
            </html>
            """
            
        response_headers = (
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: text/html\r\n"
            f"Content-Length: {len(response_body)}\r\n"
            "\r\n"
        )
        response = response_headers + response_body
        connectionSocket.sendall(response.encode())

    else:
        response = (
            "HTTP/1.1 404 Not Found\r\n"
            f"Content-Type: text/html\r\n"
            "\r\n"
            "<html><body><h1>404 Not Found</h1></body></html>"
        )
        connectionSocket.sendall(response.encode())

    connectionSocket.close()




def start_server():
    content_dir = sys.argv[1]

    serverPort = 8080

    serverSocket = socket(AF_INET, SOCK_STREAM)
    serverSocket.bind(('', serverPort))
    serverSocket.listen(1)
    print(f"Server listening on http://localhost:{serverPort}")

    while True:
        connectionSocket, adr = serverSocket.accept()
        
        thread = threading.Thread(target=handle_request, args=(connectionSocket, adr, content_dir))
        thread.start()

        # handle_request(connectionSocket, adr, content_dir)

if __name__ == "__main__":
    start_server()