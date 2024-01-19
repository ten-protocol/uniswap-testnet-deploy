FROM ubuntu:latest

RUN apt-get update -y -q && \
    apt-get upgrade -y -q && \
    apt-get -y install git curl gcc make golang-1.21 jq

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get -y install nodejs

RUN ln -s /usr/lib/go-1.17/bin/* /usr/bin/
RUN npm install -g yarn serve
RUN mkdir -p /uniswap
WORKDIR /uniswap
COPY . .

EXPOSE 3001
ENTRYPOINT ["/uniswap/deploy.sh"]