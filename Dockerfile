FROM resin/raspberrypi3-debian
RUN [ "cross-build-start" ]

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - \
&& apt-get install -yqq --no-install-recommends nodejs   && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
apt-get install -yqq --no-install-recommends g++ gcc make && rm -rf /var/lib/apt/lists/*

RUN mkdir /ClimaCollectorApp/
COPY App/package.json  /ClimaCollectorApp/package.json

RUN cd /ClimaCollectorApp \
&& npm  install 


COPY App /ClimaCollectorApp

RUN mkdir /ClimaCollectorApp/DB

RUN [ "cross-build-end" ]  



ENTRYPOINT ["node","--expose-gc","/ClimaCollectorApp/server.js"]