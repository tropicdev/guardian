# ================ #
#    Base Stage    #
# ================ #

FROM node:18-buster-slim as base

LABEL Jordan McKoy, <contact@bitecodelabs.com>

RUN apt-get update && \
    apt-get upgrade -y --no-install-recommends && \
    apt-get install -y --no-install-recommends build-essential python3 libfontconfig1 dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    npm install -g pnpm &&\
    adduser --disabled-password --home /home/container container

USER container
ENV  USER=container HOME=/home/container
COPY ./entrypoint.sh /entrypoint.sh

WORKDIR /home/container

COPY pnpm-lock.yaml .
COPY package.json .
COPY tsconfig.json .
COPY config/config.json .

# ==================== #
#   Production Stage   #
# ==================== #

# Production image used to  run the bot in production, only contains node_modules & dist contents.
FROM base as production

ENV NODE_ENV="production"

RUN pnpm install

COPY . /home/container

RUN pnpm run build

COPY --from=build /home/container/dist /home/container/dist 
COPY --from=build /home/container/node_modules /home/container/node_modules
COPY --from=build /home/container/package.json /home/container/package.json

CMD ["/bin/bash", "/entrypoint.sh"]

