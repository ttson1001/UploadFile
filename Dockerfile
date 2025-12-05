FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p uploads/ProjectA uploads/ProjectB

EXPOSE 3000

CMD ["node", "server.js"]
