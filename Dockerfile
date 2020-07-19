FROM node:8-slim

WORKDIR /dashboard_docker
ENV NODE_ENV development

COPY package.json /dashboard_docker/package.json

RUN npm install

COPY .env.example /dashboard_docker/.env.example
COPY . /dashboard_docker

CMD ["npm","start"]

EXPOSE 8080
