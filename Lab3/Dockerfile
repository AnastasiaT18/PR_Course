# Use a lightweight Node.js image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /lab3

# Copy dependency files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Expose default game port
EXPOSE 8080

# Default command runs the server with a board file
CMD ["npm", "start", "8080", "boards/perfect.txt"]
