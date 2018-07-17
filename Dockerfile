FROM resin/raspberrypi3-debian
RUN [ "cross-build-start" ]

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - \
&& apt-get install -yqq --no-install-recommends nodejs   && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
apt-get install -yqq --no-install-recommends g++ gcc make supervisor  && rm -rf /var/lib/apt/lists/*

RUN mkdir /App/
COPY App/package.json  /App/package.json

RUN cd /App \
&& npm  install 


COPY App /App



RUN [ "cross-build-end" ]  





ENTRYPOINT ["node","/App/server.js"]