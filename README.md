# pub

## .env

```
AWS_ENDPOINT=http://localhost:8088
```

## Dockerfile
``` 
FROM node:12.19.0

RUN apt-get update
RUN apt install -y openjdk-8-jdk

WORKDIR /src
```

## docker-compose.yml
```
version: '3'
services:

  nodejs:
    build: .
    container_name: nodejs
    command: [sh, -c, npm i && npx sls dynamodb install && npm run dev]
    ports:
      - "8002:3000"
    volumes:
      - ./file:/src
    tty: true
    restart: always

```
