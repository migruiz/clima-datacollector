var mqtt = require('mqtt')

function MQTTClient(mqttServer) {

    var client = mqtt.connect(mqttServer);



    client.on('reconnect', function () {
        console.log((new Date()).toString());
        console.log('reconnect');
    })
    client.on('close', function () {
        console.log((new Date()).toString());
        console.log('close');
    })
    client.on('offline', function () {
        console.log((new Date()).toString());
        console.log('offline');
    })
    client.on('error', function (error) {
        console.log((new Date()).toString());
        console.log('error');
        console.log(error);
    })
    client.on('end', function () {
        console.log((new Date()).toString());
        console.log('end');
    })

    this.subscribe = function (topic, onMessage) {
        client.subscribe(topic);
        client.on("message", function (mtopic, message) {
            if (topic === mtopic) {
                onMessage(message);
            }
        });
    }
}

var mqttClient = new MQTTClient("mqtt://localhost");

exports.cluster = function () {

    return mqttClient;
}