FROM node:20

WORKDIR /usr/src/app

COPY package* .

RUN npm install

EXPOSE 8000

COPY . .

RUN npm run build

CMD ["npm", "run", "start"]
