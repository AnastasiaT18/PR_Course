FROM node:22-alpine

WORKDIR /lab3

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "start", "8080", "boards/perfect.txt"]
