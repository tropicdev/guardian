FROM        node:18-alpine

LABEL       author="Jordan McKoy" email="jordan.bmp.mckoy@gmail.com"

RUN         apk add --update --no-cache git python3 \ && adduser -D -h /home/container container \ && npm install -g pnpm

USER        container
ENV         USER=container HOME=/home/container

WORKDIR     /home/container 

COPY        entrypoint.sh /entrypoint.sh

CMD         [ "/bin/ash", "/entrypoint.sh" ]