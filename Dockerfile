FROM node:20-alpine

WORKDIR /usr/src/app

RUN mkdir -p /usr/src/app/certs

COPY package* .

RUN npm install

EXPOSE 8000

COPY . .

RUN npm run build

CMD ["npm", "run", "start"]
