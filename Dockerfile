FROM node:8-alpine
WORKDIR /app
COPY . /app
EXPOSE 3000
CMD npm start
