FROM resin/raspberrypi3-debian


RUN apt-get update && \
apt-get install -yqq curl nano git build-essential libudev-dev openssh-client rabbitmq-server supervisor

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - \
&& apt-get install -yqq nodejs 

RUN git clone git://git.drogon.net/wiringPi \
&& cd wiringPi/ \
&& ./build \
&& cd ..


RUN curl -o openzwave-1.4.164.tar.gz  http://old.openzwave.com/downloads/openzwave-1.4.164.tar.gz \
&& tar -xzf openzwave-1.4.164.tar.gz \
&& cd openzwave-1.4.164/ \
&& make \
&& make install 

ENV LD_LIBRARY_PATH /usr/local/lib



RUN mkdir /root/.ssh/
# Copy over private key, and set permissions
ADD privateSSH  /root/.ssh/id_rsa

RUN chmod 400 /root/.ssh/id_rsa \
&& touch /root/.ssh/known_hosts \
&& ssh-keyscan vs-ssh.visualstudio.com >> /root/.ssh/known_hosts 



# Clone the conf files into the docker container
RUN git clone ssh://miguelAlfonsoRuiz@vs-ssh.visualstudio.com:22/OregonSensor/_ssh/OregonSensor \
&& cd /OregonSensor/OregonSensor \
&& make \
&& cd .. \
&& cd .. \
&& mkdir sensordata


# Clone node project
RUN git clone ssh://miguelAlfonsoRuiz@vs-ssh.visualstudio.com:22/TemperatureSensorReadingProcessor/_ssh/TemperatureSensorReadingProcessor \
&& cd /TemperatureSensorReadingProcessor \
&& npm install 


# Clone node project
RUN git clone ssh://miguelAlfonsoRuiz@vs-ssh.visualstudio.com:22/ZwaveBoiler/_ssh/ZwaveBoiler \
&& cd /ZwaveBoiler/BoilerControl \
&& npm  install 

# Clone node project
RUN git clone ssh://miguelAlfonsoRuiz@vs-ssh.visualstudio.com:22/NodeFileMonitor/_ssh/NodeFileMonitor \
&& cd /NodeFileMonitor \
&& npm  install 



ADD startup.sh  /tmp/startup.sh

RUN chmod +x /tmp/startup.sh


ADD supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 5672

ENTRYPOINT ["/usr/bin/supervisord"]