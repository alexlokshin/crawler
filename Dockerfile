FROM node:8.0-alpine
WORKDIR /app
COPY . /app
EXPOSE 3000
CMD npm start
