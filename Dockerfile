FROM node:8-alpine
WORKDIR /app
COPY . /app
RUN apk add --no-cache curl
RUN npm install pm2 -g
EXPOSE 3000
ENTRYPOINT [ "pm2-runtime", "/app/app.yaml" ]
